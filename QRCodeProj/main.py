import qrcode
url = input("Enter the URL: ")
img = qrcode.make(url)

filename = input("Enter filename to save QR code (include extension): ")
img.save(filename)
print(f"QR code saved as {filename}")