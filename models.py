from SQLAlchemy import SQLAlchemy

db = SQLAlchemy()

# Object class setup
class Message(db.Model):
    __tablename__ = "messages"
    room_name = db.Column(db.String, nullable=False)
    room_id = db.Column(db.String, nullable=False)
    message = db.Column(db.String, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id") nullable=False)


class User(db.Model):
    __tablename__ = "users"
    user_name = db.Column(db.String, nullable=False)
    user_id = db.Column(db.Integer, primary_key=True)

# Will actually need to create these in my heroku databse.
