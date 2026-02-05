import os

def rename_files():
    folder = input("Enter folder path: ").strip()
    prefix = input("Enter prefix (e.g. s or p): ").strip()
    start_num = int(input("Enter starting number (e.g. 1): ").strip())

    if not os.path.isdir(folder):
        print("❌ Invalid folder path")
        return

    files = [
        f for f in os.listdir(folder)
        if os.path.isfile(os.path.join(folder, f))
    ]

    files.sort()  # important for predictable order

    current = start_num

    for filename in files:
        old_path = os.path.join(folder, filename)
        name, ext = os.path.splitext(filename)

        if not ext:
            continue

        new_name = f"{prefix}{current}{ext.lower()}"
        new_path = os.path.join(folder, new_name)

        if os.path.exists(new_path):
            print(f"⚠️ Skipping {filename}, target exists")
            continue

        os.rename(old_path, new_path)
        print(f"✔ {filename} → {new_name}")

        current += 1

    print("✅ Renaming completed")

if __name__ == "__main__":
    rename_files()
