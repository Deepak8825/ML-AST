"""Quick test: verify normalize_target_name handles all dataset formats."""
from lightcurve_service import normalize_target_name, validate_target

tests = [
    ("K00744.01",   "KOI-744"),
    ("K00114.01",   "KOI-114"),
    ("K00001.01",   "KOI-1"),
    ("Kepler-8 b",  "Kepler-8"),
    ("KOI-114.01",  "KOI-114"),
    ("KIC 12345",   "KIC 12345"),
    ("Kepler-22",   "Kepler-22"),
]

print("=== Normalization Tests ===")
passed = 0
for raw, expected in tests:
    result = normalize_target_name(raw)
    ok = result == expected
    passed += ok
    print(f"  {raw!r:20s} -> {result!r:15s} {'PASS' if ok else f'FAIL (expected {expected!r})'}")

print(f"\n{passed}/{len(tests)} normalization tests passed.\n")

print("=== Validation Tests ===")
for raw, expected in tests:
    try:
        result = validate_target(raw)
        print(f"  {raw!r:20s} -> validate OK: {result!r}")
    except Exception as e:
        print(f"  {raw!r:20s} -> REJECTED: {e}")

print("\n=== Security Tests (must reject) ===")
bad_inputs = ["../../etc/passwd", "; rm -rf /", "<script>alert(1)</script>", ""]
for bad in bad_inputs:
    try:
        validate_target(bad)
        print(f"  {bad!r:30s} -> SECURITY FAIL (was accepted!)")
    except ValueError:
        print(f"  {bad!r:30s} -> Correctly blocked")
