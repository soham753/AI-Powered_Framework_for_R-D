from mongoengine import Document, StringField, EmailField

class User(Document):
    name = StringField(required=True, max_length=100)
    email = EmailField(required=True, unique=True)
    password = StringField(required=True)
    emp_id = StringField(required=True, unique=True)
    profile_image = StringField(required=False) 

    meta = {
        'collection': 'users'  
    }
