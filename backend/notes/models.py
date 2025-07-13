from mongoengine import Document, StringField, FloatField, DateTimeField, ListField,ReferenceField
from datetime import datetime
from project_Dashboard.models import Project


class Product(Document):
    """
    Independent Product model to store scraped or manually entered product data.
    """

    name = StringField(required=True)# e.g., "Amazon", "Robu"
    price = FloatField(required=True) 
    project =ReferenceField(Project, required=True, reverse_delete_rule=2)

    meta = {
        'collection': 'products'
    }


class Note(Document):
    """
    Independent Note model to store basic note content with timestamps.
    """
    title = StringField(required=True)
    content = StringField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)
    last_accessed = DateTimeField(default=datetime.utcnow)
    project =ReferenceField(Project, required=True, reverse_delete_rule=2)
    
    meta = {
        'collection': 'notes',
        'ordering': ['-created_at']
    }

    def clean(self):
        if not self.created_at:
            self.created_at = datetime.utcnow()
