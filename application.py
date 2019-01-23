import os
import requests

from flask import Flask, session, redirect, render_template, request, jsonify
from flask_socketio import SocketIO, emit
from flask_session import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from flask_sqlalchemy import SQLAlchemy
#from flask_heroku import Heroku

# Imports the classes from models.py
#from models import *
#db.create_all()

app = Flask(__name__)

# Socket setup
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app, manage_session=False) # manage_session=False hands the session handling to flask

# Database setup
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgres://yvmypvesmwtmzo:e9224998c3a09576fd8640942a82428f33415c6e36a2e49c6b91e9d91b9e037d@ec2-54-75-230-41.eu-west-1.compute.amazonaws.com:5432/db53552ukasjon'
#app.config['SQLAlCHEMY_TRACK_MODIFICATIONS'] = False
#heroku = Heroku(app)
db = SQLAlchemy(app)



# Configure session to use filesystem
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Object class setup
class Message(db.Model):
    __tablename__ = "messages"
    message_id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.String, db.ForeignKey("rooms.room_id"), nullable=False)
    message = db.Column(db.String, nullable=False
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)

class Room(db.Model):
    __tablename__ = "rooms"
    room_id = db.Column(db.String, primary_key=True)
    room_name = db.Column(db.String, nullable=False)

class User(db.Model):
    __tablename__ = "users"
    user_id = db.Column(db.Integer, primary_key=True)
    user_name = db.Column(db.String, nullable=False)

# Server routes
@app.route("/")
def index():
    return render_template("index.html")

@socketio.on("submit username")
def message(data):
    user = data["username"]
    # Will need SQLAlchemy code here to verify the user name. If a new user return a welcome message
    emit("verify user", {"username": user}, broadcast=True)

@socketio.on("submit message")
def message(data):
    message = data["message"]
    user = data["username"]
    # Will need to also recieve and return the timestamp from the browsersxs
    emit("announce message", {"message": message, "username": user}, broadcast=True)

# Need to handle creating new rooms. The message needs to be sent to the server. A new table needs to be made to hold the
# messages and then the index page needs to be updated to show the new room.
