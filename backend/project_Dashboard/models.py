from mongoengine import Document, StringField, ReferenceField, DateTimeField
from register.models import User  # Link to the User model
import datetime

class Project(Document):
    title = StringField(required=True)
    category =  StringField(required=True)  # Category of the project
    description = StringField()
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    user = ReferenceField(User, required=True, reverse_delete_rule=2)  # Linked to a User

    meta = {
        'collection': 'projects'
    }
