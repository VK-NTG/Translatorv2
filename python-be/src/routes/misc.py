from flask_restx import Namespace, Resource, fields
import os

ns_misc = Namespace("misc", description="Misc endpoints")

# Import version
from version import __version__

echo_model = ns_misc.model(
    "EchoModel",
    {"message": fields.String(required=True, description="A message to echo")},
)


@ns_misc.route("/ping")
class Ping(Resource):
    def get(self):
        return {"message": "pong"}


@ns_misc.route("/health")
class Health(Resource):
    def get(self):
        return {
            "status": "ok",
            "message": "KK AI Translator",
            "version": __version__,
            "provider": "Azure Translator + OpenAI",
            "auth": "API Key + JWT Bearer"
        }


@ns_misc.route("/version")
class Version(Resource):
    def get(self):
        return {"version": __version__}


@ns_misc.route("/echo")
class Echo(Resource):
    @ns_misc.expect(echo_model)
    def post(self):
        # Read payload from ns_misc.payload
        data = ns_misc.payload
        return {"you_sent": data, "env_msg": os.getenv("TEST_ENV_VAR", "not set")}
