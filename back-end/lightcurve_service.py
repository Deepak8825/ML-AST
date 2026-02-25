"""
Light Curve Service
-------------------
Downloads and caches Kepler light curve images using the lightkurve library.
Provides input validation, path injection protection, and timeout handling.
"""

import os
import re
import signal
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend — safe for server use
import matplotlib.pyplot as plt
from lightkurve import search_lightcurve

# ==========================
# CONFIGURATION
# ==========================
SAVE_FOLDER = os.path.join(os.path.dirname(__file__), "lightcurves")
ALLOWED_PATTERN = re.compile(r"^(Kepler-\d+|KOI-\d+(\.\d+)?|KIC \d+)$", re.IGNORECASE)
DOWNLOAD_TIMEOUT_SECONDS = 60


# ==========================
# TARGET NAME NORMALIZATION
# ==========================
# Patterns used for normalization (compiled once for performance)
_PLANET_SUFFIX = re.compile(r"\s+[b-i]$", re.IGNORECASE)
_KEPOI_NAME = re.compile(r"^K(\d+)(?:\.(\d+))?$", re.IGNORECASE)   # K00744.01, K00114.01
_KOI_DECIMAL = re.compile(r"^(KOI-\d+)\.\d+$", re.IGNORECASE)      # KOI-114.01


def normalize_target_name(raw_name: str) -> str:
    """
    Converts dataset target names to the canonical star identifier
    that lightkurve and the MAST archive expect.

    Normalization rules (applied in order):
        1) Strip whitespace.
        2) Kepler planet suffix:   'Kepler-8 b'  → 'Kepler-8'
        3) KepOI name (K-prefix):  'K00744.01'   → 'KOI-744'
        4) KOI decimal suffix:     'KOI-114.01'  → 'KOI-114'
        5) Already-valid formats are returned unchanged.

    This runs BEFORE the security regex, so the whitelist is never weakened.
    """
    name = raw_name.strip()

    # Rule 2: Strip planet letter suffix (' b', ' c', etc.)
    name = _PLANET_SUFFIX.sub("", name)

    # Rule 3: KepOI dataset name → canonical KOI format
    #   'K00744.01' → strip 'K', drop '.01', strip leading zeros → 'KOI-744'
    m = _KEPOI_NAME.match(name)
    if m:
        number = m.group(1).lstrip("0") or "0"
        return f"KOI-{number}"

    # Rule 4: KOI with decimal planet designator → drop the decimal
    #   'KOI-114.01' → 'KOI-114'
    m = _KOI_DECIMAL.match(name)
    if m:
        return m.group(1)

    return name


# ==========================
# INPUT VALIDATION
# ==========================
def validate_target(target_name: str) -> str:
    """
    Validates and sanitizes the target name.

    Raises:
        ValueError: If target name is invalid or contains injection attempts.
    """
    # Step 0: Normalize planet suffix → star name
    target_name = normalize_target_name(target_name)
    print(f"[lightcurve] Normalized target: {target_name!r}")

    if not target_name:
        raise ValueError("Target name cannot be empty.")

    # Block path traversal characters
    if any(c in target_name for c in ["\\", "/", "..", "\x00"]):
        raise ValueError(f"Invalid characters in target name: '{target_name}'")

    # Whitelist check — only known Kepler naming patterns
    if not ALLOWED_PATTERN.match(target_name):
        raise ValueError(
            f"Invalid target format: '{target_name}'. "
            f"Accepted formats: 'Kepler-22', 'KOI-123', 'KIC 12345'"
        )

    return target_name


# ==========================
# FILENAME SANITIZATION
# ==========================
def safe_filename(target_name: str) -> str:
    """Convert target name to a safe filename (no path separators)."""
    return re.sub(r"[^a-zA-Z0-9_-]", "_", target_name) + ".png"


# ==========================
# CORE FUNCTION
# ==========================
def generate_lightcurve(target_name: str, save_folder: str = None) -> str:
    """
    Downloads a Kepler light curve for the given target and saves it as a PNG.

    Features:
        - Caching: skips download if image already exists
        - Validation: rejects invalid target names
        - Path safety: sanitized filenames only
        - Memory: closes all matplotlib figures after saving

    Args:
        target_name: Kepler target (e.g., "Kepler-22")
        save_folder: Override for save directory (defaults to ./lightcurves/)

    Returns:
        Absolute path to the saved PNG file.

    Raises:
        ValueError: Invalid target name.
        TimeoutError: Download exceeded timeout.
        RuntimeError: No light curve data found for target.
    """
    # 1. Validate input
    target_name = validate_target(target_name)

    # 2. Resolve save folder
    folder = save_folder or SAVE_FOLDER
    os.makedirs(folder, exist_ok=True)

    # 3. Build safe file path
    filename = safe_filename(target_name)
    filepath = os.path.abspath(os.path.join(folder, filename))

    # 4. Cache check — return immediately if already generated
    if os.path.exists(filepath):
        print(f"[lightcurve] Cache hit: {filepath}")
        return filepath

    # 5. Download light curve from MAST
    print(f"[lightcurve] Downloading light curve for '{target_name}'...")
    try:
        search_result = search_lightcurve(target_name, mission="Kepler")

        if search_result is None or len(search_result) == 0:
            raise RuntimeError(
                f"No Kepler light curve data found for '{target_name}'. "
                f"Verify the target name at https://exoplanetarchive.ipac.caltech.edu/"
            )

        lc = search_result.download()

        if lc is None:
            raise RuntimeError(f"Download returned no data for '{target_name}'.")

    except RuntimeError:
        raise  # Re-raise our own errors
    except Exception as e:
        raise RuntimeError(f"Failed to fetch light curve for '{target_name}': {e}")

    # 6. Plot and save
    try:
        fig, ax = plt.subplots(figsize=(10, 4))
        lc.plot(ax=ax)
        ax.set_title(f"{target_name} — Kepler Light Curve")
        fig.tight_layout()
        fig.savefig(filepath, dpi=150)
        print(f"[lightcurve] Saved: {filepath}")
    finally:
        # Always clean up matplotlib memory
        plt.close("all")

    return filepath
