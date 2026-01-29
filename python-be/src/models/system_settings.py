from datetime import datetime
from db.sql import db


class SystemSettings(db.Model):
    """
    Stores global system settings and prompts for the translation system.

    DATABASE SETUP NEEDED WHEN DB IS ACCESSIBLE:
    1. Run: flask db migrate -m "Add system_settings table"
    2. Run: flask db upgrade
    3. Insert default system prompt and settings
    """
    __tablename__ = "system_settings"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # Setting identification
    setting_key = db.Column(db.String(100), nullable=False, unique=True)  # 'base_system_prompt', 'default_domain', etc.
    setting_name = db.Column(db.String(200), nullable=False)  # Human readable name
    description = db.Column(db.Text)  # Description of what this setting does

    # Setting value (flexible storage)
    setting_value = db.Column(db.Text)  # Main setting value (JSON for complex values)
    setting_type = db.Column(db.String(50), nullable=False, default='text')  # 'text', 'json', 'boolean', 'integer'

    # Context information
    category = db.Column(db.String(50), nullable=False, default='general')  # 'prompts', 'domains', 'behavior', etc.
    is_user_configurable = db.Column(db.Boolean, default=True)  # Whether users can modify this setting

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        # Parse JSON values if applicable
        value = self.setting_value
        if self.setting_type == 'json' and value:
            try:
                import json
                value = json.loads(value)
            except:
                pass
        elif self.setting_type == 'boolean':
            value = value.lower() in ('true', '1', 'yes', 'on') if value else False
        elif self.setting_type == 'integer':
            try:
                value = int(value) if value else 0
            except:
                value = 0

        return {
            "id": self.id,
            "setting_key": self.setting_key,
            "setting_name": self.setting_name,
            "description": self.description,
            "setting_value": value,
            "setting_type": self.setting_type,
            "category": self.category,
            "is_user_configurable": self.is_user_configurable,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "is_active": self.is_active
        }

    @classmethod
    def get_setting(cls, key, default=None):
        """Get a setting value by key"""
        setting = cls.query.filter_by(setting_key=key, is_active=True).first()
        if setting:
            # Parse the value based on type
            if setting.setting_type == 'json' and setting.setting_value:
                try:
                    import json
                    return json.loads(setting.setting_value)
                except:
                    return default
            elif setting.setting_type == 'boolean':
                return setting.setting_value.lower() in ('true', '1', 'yes', 'on') if setting.setting_value else False
            elif setting.setting_type == 'integer':
                try:
                    return int(setting.setting_value) if setting.setting_value else 0
                except:
                    return default
            else:
                return setting.setting_value
        return default

    @classmethod
    def set_setting(cls, key, value, setting_type='text', setting_name=None):
        """Set or update a setting value"""
        setting = cls.query.filter_by(setting_key=key).first()

        # Convert value to string based on type
        if setting_type == 'json':
            import json
            str_value = json.dumps(value)
        elif setting_type == 'boolean':
            str_value = 'true' if value else 'false'
        else:
            str_value = str(value)

        if setting:
            setting.setting_value = str_value
            setting.setting_type = setting_type
            setting.updated_at = datetime.utcnow()
        else:
            # Generate a default setting_name if not provided
            if not setting_name:
                setting_name = key.replace('_', ' ').title()

            setting = cls(
                setting_key=key,
                setting_name=setting_name,
                setting_value=str_value,
                setting_type=setting_type
            )
            db.session.add(setting)

        db.session.commit()
        return setting

    @classmethod
    def get_by_category(cls, category):
        """Get all settings in a category"""
        return cls.query.filter_by(category=category, is_active=True).all()

    @classmethod
    def get_user_configurable(cls):
        """Get all user-configurable settings"""
        return cls.query.filter_by(is_user_configurable=True, is_active=True).all()


# SAMPLE DATA TO INSERT WHEN DATABASE IS ACCESSIBLE:
"""
INSERT SAMPLE DATA:

# Base system prompt
SystemSettings(
    setting_key='base_system_prompt',
    setting_name='Base System Prompt',
    description='The foundational prompt used for all translations',
    setting_value='You are a professional interpreter working for Kalundborg Municipality. Your role is to provide accurate, culturally appropriate translations that maintain the intent and tone of the original message. Always consider the cultural context of both the source and target languages.',
    setting_type='text',
    category='prompts',
    is_user_configurable=True
)

# Default domain
SystemSettings(
    setting_key='default_domain',
    setting_name='Default Domain',
    description='The default domain/context for translations',
    setting_value='municipal_services',
    setting_type='text',
    category='behavior',
    is_user_configurable=True
)

# Available domains
SystemSettings(
    setting_key='available_domains',
    setting_name='Available Domains',
    description='List of available translation domains',
    setting_value='["municipal_services", "healthcare", "legal", "education", "social_services"]',
    setting_type='json',
    category='behavior',
    is_user_configurable=True
)

# Translation enhancement enabled
SystemSettings(
    setting_key='context_enhancement_enabled',
    setting_name='Context Enhancement Enabled',
    description='Whether to use contextual enhancements in translations',
    setting_value='true',
    setting_type='boolean',
    category='behavior',
    is_user_configurable=True
)
"""