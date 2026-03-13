import os
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dotenv import load_dotenv

load_dotenv()

MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_HOST = os.getenv("MYSQL_HOST")
MYSQL_PORT = os.getenv("MYSQL_PORT", 3306)
MYSQL_DB = os.getenv("MYSQL_DB")

DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"

db = SQLAlchemy()
migrate = Migrate()


def init_db(app):
    # Only set DATABASE_URL if not already configured (allows tests to override)
    if "SQLALCHEMY_DATABASE_URI" not in app.config:
        app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL

    if "SQLALCHEMY_TRACK_MODIFICATIONS" not in app.config:
        app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Only set engine options if using MySQL (not for SQLite tests)
    if "SQLALCHEMY_DATABASE_URI" in app.config and app.config["SQLALCHEMY_DATABASE_URI"].startswith("mysql"):
        app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
            # Ping connections before each use
            "pool_pre_ping": True,
            # Reconnect if a connection is older than X seconds
            "pool_recycle": 3600,
            "pool_size": 5,
            "max_overflow": 2,
            "connect_args": {"ssl": {"ssl_verify_cert": True}},
        }

    db.init_app(app)
    migrate.init_app(app, db)

    # 👇 DEV convenience: create tables if they don't exist
    with app.app_context():
        db.create_all()
