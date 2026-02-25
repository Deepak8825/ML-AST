from lightkurve import search_lightcurve
import matplotlib.pyplot as plt
import os

def generate_lightcurve(target_name: str, save_folder="lightcurves"):
    """
    Downloads Kepler light curve for a target
    and saves it as PNG.
    """

    os.makedirs(save_folder, exist_ok=True)

    print(f"Fetching light curve for {target_name}...")

    lc = search_lightcurve(target_name, mission="Kepler").download()

    filename = f"{target_name.replace(' ', '_')}.png"
    filepath = os.path.join(save_folder, filename)

    ax = lc.plot()
    plt.title(f"{target_name} Light Curve")
    plt.savefig(filepath)
    plt.close()

    print(f"Saved at {filepath}")

    return filepath


# TEST CALL
if __name__ == "__main__":
    generate_lightcurve("Kepler-22")