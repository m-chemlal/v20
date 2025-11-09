import boto3
from botocore.exceptions import ClientError
from config import settings
from typing import BinaryIO, Optional
import uuid
from datetime import timedelta

# Initialize S3 client
s3_client = None
if settings.s3_access_key_id and settings.s3_secret_access_key:
    s3_client = boto3.client(
        's3',
        endpoint_url=settings.s3_endpoint_url,
        aws_access_key_id=settings.s3_access_key_id,
        aws_secret_access_key=settings.s3_secret_access_key,
        region_name=settings.s3_region
    )


def upload_file(
    file_content: BinaryIO,
    filename: str,
    project_id: int,
    content_type: str
) -> tuple[str, int]:
    """Upload file to S3 and return URL and size"""
    if not s3_client:
        raise Exception("S3 client not configured")
    
    # Generate unique filename
    file_extension = filename.split('.')[-1] if '.' in filename else ''
    unique_filename = f"{uuid.uuid4()}.{file_extension}" if file_extension else str(uuid.uuid4())
    s3_key = f"projects/{project_id}/{unique_filename}"
    
    # Read file content
    file_content.seek(0)
    file_data = file_content.read()
    file_size = len(file_data)
    
    # Check file size
    max_size = settings.max_upload_size_mb * 1024 * 1024
    if file_size > max_size:
        raise ValueError(f"File size exceeds maximum allowed size of {settings.max_upload_size_mb}MB")
    
    # Upload to S3
    try:
        s3_client.put_object(
            Bucket=settings.s3_bucket_name,
            Key=s3_key,
            Body=file_data,
            ContentType=content_type
        )
        
        # Generate URL
        url = f"s3://{settings.s3_bucket_name}/{s3_key}"
        
        return url, file_size
    except ClientError as e:
        raise Exception(f"Failed to upload file to S3: {str(e)}")


def get_presigned_url(s3_key: str, expiration: int = 3600) -> Optional[str]:
    """Generate presigned URL for S3 object"""
    if not s3_client:
        return None
    
    try:
        # Extract key from s3:// URL if needed
        if s3_key.startswith("s3://"):
            s3_key = s3_key.replace(f"s3://{settings.s3_bucket_name}/", "")
        
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': settings.s3_bucket_name, 'Key': s3_key},
            ExpiresIn=expiration
        )
        return url
    except ClientError:
        return None


def delete_file(s3_key: str) -> bool:
    """Delete file from S3"""
    if not s3_client:
        return False
    
    try:
        # Extract key from s3:// URL if needed
        if s3_key.startswith("s3://"):
            s3_key = s3_key.replace(f"s3://{settings.s3_bucket_name}/", "")
        
        s3_client.delete_object(Bucket=settings.s3_bucket_name, Key=s3_key)
        return True
    except ClientError:
        return False


def validate_file_type(filename: str) -> bool:
    """Validate file type against allowed types"""
    if not filename or '.' not in filename:
        return False
    
    file_extension = filename.split('.')[-1].lower()
    allowed_extensions = [ext.strip().lower() for ext in settings.allowed_file_types_list]
    
    # Map common extensions
    extension_map = {
        'jpg': 'jpg',
        'jpeg': 'jpg',
        'pdf': 'pdf',
        'png': 'png',
        'xlsx': 'xlsx'
    }
    
    normalized_ext = extension_map.get(file_extension, file_extension)
    return normalized_ext in allowed_extensions

