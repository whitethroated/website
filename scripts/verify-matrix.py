#!/usr/bin/env python3
"""Cross-check pilot report tables against raw per-round JSON (exporter-style).

Fails loudly on any mismatch. Transcribed expectations below come from
sources/pilot/benchmark-tier1-default-2026-10-18.md tables.
"""
import json
import statistics
import sys

RAW = json.load(open("sources/pilot/tier1-default-2026-10-18.json"))
SITE = json.load(open("sources/pilot/site-data.json"))

SERVERS = {"before-stock": "Old stock", "before-tier1": "Old Tier 1",
           "after-default": "Current default", "after-stock": "Current forced stock",
           "raw": "Raw NIO"}
ROUTES = {"root": "GET /", "user-get": "GET /user/42", "user-post": "POST /user",
          "stream-known": "Known length", "stream-chunked": "Chunked"}

# (route, conns) -> {server: value}; servers in report column order
THROUGHPUT = {
    ("GET /", 64): [203664, 202248, 199148, 196847],
    ("GET /", 256): [206680, 200972, 195248, 205403],
    ("GET /", 512): [187596, 198518, 188394, 203912],
    ("GET /user/42", 64): [172526, 201150, 203708, 195782],
    ("GET /user/42", 256): [177696, 201876, 195313, 185049],
    ("GET /user/42", 512): [175212, 189378, 196387, 186685],
    ("POST /user", 64): [192266, 191226, 188956, 194428],
    ("POST /user", 256): [190680, 187680, 178070, 192308],
    ("POST /user", 512): [184685, 183616, 183238, 183930],
}
MAIN_COLS = ["before-stock", "before-tier1", "after-default", "raw"]

P99 = {
    ("GET /", 64): [673, 863, 764, 729],
    ("GET /", 256): [2548, 2929, 2538, 2689],
    ("GET /", 512): [4941, 5202, 5037, 6160],
    ("GET /user/42", 64): [801, 695, 727, 755],
    ("GET /user/42", 256): [2851, 2698, 2631, 2661],
    ("GET /user/42", 512): [6898, 5053, 5028, 5940],
    ("POST /user", 64): [715, 709, 788, 700],
    ("POST /user", 256): [2638, 2392, 2448, 2964],
    ("POST /user", 512): [5734, 3628, 5175, 5328],
}

# stream: (route, conns) -> [(rps, p99)] for old-stock, forced-stock, default
STREAMS = {
    ("Known length", 64): [(127650, 1284), (120894, 1049), (141240, 938)],
    ("Known length", 256): [(130528, 3020), (128141, 3537), (141240, 3193)],
    ("Known length", 512): [(127944, 5001), (128762, 5596), (138387, 8766)],
    ("Chunked", 64): [(109574, 1102), (112207, 1131), (122856, 1098)],
    ("Chunked", 256): [(110691, 3931), (111648, 4685), (123906, 3673)],
    ("Chunked", 512): [(109386, 7692), (110284, 9863), (128152, 5602)],
}
STREAM_COLS = ["before-stock", "after-stock", "after-default"]


def cell(server, route, conns, latency, key):
    vals = [s["metrics"][key] for s in RAW["samples"]
            if s["server"] == server and s["route"] == route
            and s["connections"] == conns and s["latency"] is latency]
    assert len(vals) == 4, f"{server}/{route}/{conns}/{latency}: {len(vals)} rounds"
    return statistics.median(vals), sorted(vals)


R2J = {v: k for k, v in ROUTES.items()}
errors = []

for (route, conns), expected in THROUGHPUT.items():
    for srv, exp in zip(MAIN_COLS, expected):
        med, _ = cell(srv, R2J[route], conns, False, "requests_per_second")
        if round(med) != exp:
            errors.append(f"RPS {route} c{conns} {srv}: raw median {med} != report {exp}")

for (route, conns), expected in P99.items():
    for srv, exp in zip(MAIN_COLS, expected):
        med, _ = cell(srv, R2J[route], conns, True, "latency_p99_us")
        if round(med) != exp:
            errors.append(f"p99 {route} c{conns} {srv}: raw median {med} != report {exp}")

for (route, conns), expected in STREAMS.items():
    for srv, (exp_rps, exp_p99) in zip(STREAM_COLS, expected):
        med_rps, _ = cell(srv, R2J[route], conns, False, "requests_per_second")
        med_p99, _ = cell(srv, R2J[route], conns, True, "latency_p99_us")
        if round(med_rps) != exp_rps:
            errors.append(f"stream RPS {route} c{conns} {srv}: {med_rps} != {exp_rps}")
        if round(med_p99) != exp_p99:
            errors.append(f"stream p99 {route} c{conns} {srv}: {med_p99} != {exp_p99}")

# site-data.json figures must match the GET / report cells
rep = SITE["reports"][0]
FIG_SRV = {"old-stock": "before-stock", "old-tier1": "before-tier1",
           "current-default": "after-default", "raw-nio": "raw"}
for fig in rep["figures"]:
    key = (fig["route"], fig["connections"])
    idx = MAIN_COLS.index(FIG_SRV[fig["server"]])
    if fig["requestsPerSecond"] != THROUGHPUT[key][idx]:
        errors.append(f"site-data RPS mismatch: {fig['label']}")
    if fig["p99Microseconds"] != P99[key][idx]:
        errors.append(f"site-data p99 mismatch: {fig['label']}")

if errors:
    print("MISMATCHES:")
    print("\n".join(errors))
    sys.exit(1)
print(f"OK: {len(THROUGHPUT)*4} RPS + {len(P99)*4} p99 + {len(STREAMS)*6} stream cells "
      f"+ {len(rep['figures'])} site-data figures all match.")
