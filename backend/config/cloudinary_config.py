import cloudinary
import cloudinary.uploader
import cloudinary.api

cloudinary.config(
  cloud_name = 'dutui5dbt', 
  api_key = '464547771659791', 
  api_secret = 'M3ky7K8mwExaYbHe4dlRIrHZSYA'
)

def upload_image(image_path):
    """ Uploads an image to Cloudinary and returns the URL. """
    try:
        response = cloudinary.uploader.upload(image_path)
        return response.get("secure_url")  # Returns the secure URL of the uploaded image
    except Exception as e:
        print(f"Error uploading image: {e}")
        return None