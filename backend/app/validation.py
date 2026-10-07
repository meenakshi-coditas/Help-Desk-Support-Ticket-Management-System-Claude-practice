"""Small, reusable validators. Each returns a cleaned value and records problems in an `errors` dict."""
from . import config
from .models import Category


def clean_text(value):
    return value.strip() if isinstance(value, str) else ""


def validate_ticket_fields(data, errors):
    """Applies BR-1..BR-3 and the provisional limits; returns cleaned values."""
    subject = clean_text(data.get("subject"))
    description = clean_text(data.get("description"))
    priority = data.get("priority")
    category_id = data.get("categoryId")

    if not subject:
        errors["subject"] = "Subject is required."
    elif len(subject) > config.SUBJECT_MAX:
        errors["subject"] = f"Subject must be at most {config.SUBJECT_MAX} characters."

    if not description:
        errors["description"] = "Description is required."
    elif len(description) < config.DESCRIPTION_MIN:
        errors["description"] = f"Description must contain at least {config.DESCRIPTION_MIN} characters."
    elif len(description) > config.DESCRIPTION_MAX:
        errors["description"] = f"Description must be at most {config.DESCRIPTION_MAX} characters."

    if not priority:
        errors["priority"] = "Please select a priority."
    elif priority not in config.PRIORITIES:
        errors["priority"] = "Invalid priority."

    category = None
    if category_id in (None, ""):
        errors["categoryId"] = "Please select a category."
    else:
        try:
            category = Category.query.filter_by(id=int(category_id), is_active=True).first()
        except (TypeError, ValueError):
            category = None
        if not category:
            errors["categoryId"] = "Invalid category."

    return {"subject": subject, "description": description, "priority": priority, "category": category}


def validate_attachment(file, errors):
    """Returns (bytes, extension) or None. Checks extension allow-list and size."""
    if file is None or not file.filename:
        return None
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in config.ATTACHMENT_EXTENSIONS:
        errors["attachment"] = f"Unsupported file type. Allowed: {', '.join(sorted(config.ATTACHMENT_EXTENSIONS))}."
        return None
    content = file.read(config.ATTACHMENT_MAX_BYTES + 1)
    if len(content) > config.ATTACHMENT_MAX_BYTES:
        errors["attachment"] = f"File is too large. Maximum size is {config.ATTACHMENT_MAX_BYTES // (1024 * 1024)} MB."
        return None
    return content, ext
