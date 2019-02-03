import os
import requests

from flask import Flask, session, redirect, render_template, request, jsonify
from flask_socketio import SocketIO, emit
from flask_session import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from flask_sqlalchemy import SQLAlchemy
import json

app = Flask(__name__)

# Socket setup
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app, manage_session=False) # manage_session=False hands the session handling to flask

# Database setup
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgres://yvmypvesmwtmzo:e9224998c3a09576fd8640942a82428f33415c6e36a2e49c6b91e9d91b9e037d@ec2-54-75-230-41.eu-west-1.compute.amazonaws.com:5432/db53552ukasjon'
db = SQLAlchemy(app)

# Configure session to use filesystem
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Object class setup
class User(db.Model):
    __tablename__ = "users"
    user_id = db.Column(db.Integer, primary_key=True)
    user_name = db.Column(db.String, nullable=False)
    user_link = db.relationship('Message', backref='user_message')

class Room(db.Model):
    __tablename__ = "rooms"
    room_id = db.Column(db.Integer, primary_key=True)
    room_name = db.Column(db.String, nullable=False)

class Message(db.Model):
    __tablename__ = "messages"
    message_id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey("rooms.room_id"), nullable=False)
    message = db.Column(db.String, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)
    timestamp = db.Column(db.DateTime(timezone=True) , nullable=False)


# Server routes
@app.route("/")
def index():
    return render_template("index.html")

# When the user enters a username
@socketio.on("submit username")
def submit_username(data):
    user = data["username"]
    indatabase = User.query.filter_by(user_name=user).all()

    if not indatabase:
        user_entry = User(user_name=user)
        db.session.add(user_entry)
        db.session.commit()
        emit("verify user", {"username": user}, broadcast=True)

    else:
        emit("verify user", {"username": user}, broadcast=True)

# Fetching the list of rooms in the databse
@socketio.on("room_list")
def room_list():
    print("getting list")
    roomlist = Room.query.all()
    list = []
    for room in roomlist:
        list.append(room.room_name)
    emit("list_of_rooms", {"list": list}, broadcast=True)

# When the user creates a new room
@socketio.on("submit room")
def submit_room(data):
    newroom = data["room"]
    indatabase = Room.query.filter_by(room_name=newroom).all()

    if not indatabase:
        room_entry = Room(room_name=newroom)
        db.session.add(room_entry)
        db.session.commit()
        data = Room.query.filter_by(room_name=newroom).all()
        room = data[0].room_name
        id = data[0].room_id
        emit("verify room", {"success": True, "roomid": id, "roomname": room}, broadcast=True)

    else:
        # Send back an error message that the room already exists
        emit("verify room", {"success": False}, broadcast=True)

# When the user selects a current room
@socketio.on("choose_room")
def choose_room(data):
    selectedroom = data["room"]
    print("room = ", selectedroom)
    indatabase = Room.query.filter_by(room_name=selectedroom).all()
    id = indatabase[0].room_id

    if id:
        # This code gives all of the returned values from both tables
        """
        messages = db.session.query(User, Message).outerjoin(Message, User.user_id == Message.user_id).all()
        print(messages)
        # Need to filter by room and limit to 100 messages
        messagelist = []
        for message in messages:
            if message[1]:
                print(message)
                print(message[0].user_name)
                print(message[1].message)
                messagedict = {}
                messagedict["roomname"] = data["room"]
                messagedict["message"] = message[1].message
                messagedict["username"] = message[0].user_name
                messagelist.append(messagedict)
        print(messagelist)

        """
        
        # To get just one column from each
        messages = db.session.query(User.user_name, Message.message, Message.timestamp).outerjoin(Message, User.user_id == Message.user_id).filter_by(room_id=id).limit(100)
        print(messages)
        messagelist = []
        for message in messages:
            if message[1]:
                messagedict = {}
                messagedict["roomname"] = data["room"]
                messagedict["message"] = message[1]
                messagedict["username"] = message[0]
                messagedict["username"] = message[2]
                messagelist.append(messagedict)
        print(messagelist)

        jsonmessage = json.dumps(messagelist)

        # Returns the room data and the last 100 messages to be posted in that room
        emit("room_choice", {"success": True, "roomname": selectedroom, "message": jsonmessage}, broadcast=True)

@socketio.on("submit message")
def submit_message(data):
    message = data["message"]
    userpost = data["username"]
    userdata = User.query.filter_by(user_name=userpost).all()
    user = userdata[0].user_id
    room = data["roomdata"]
    roomdata = Room.query.filter_by(room_name=room).all()
    roomid = roomdata[0].room_id
    messagetime = data["timestamp"]

    add_message = Message(room_id=roomid, message=message, user_id=user, timestamp=messagetime)
    db.session.add(add_message)
    db.session.commit()

    emit("announce message", {"message": message, "username": userpost, "roomname": room, "timestamp": messagetime}, broadcast=True)
