"""Check required SkyNudge tables, RLS, and the auth profile trigger."""
from __future__ import annotations

from uuid import uuid4

from database import get_connection

TABLES = (
    "profiles",
    "verification_requests",
    "nudges",
    "nudge_sightings",
    "nudge_pings",
    "sky_moments",
    "sky_moment_photos",
    "reports",
    "user_blocks",
)


def main() -> None:
    connection = get_connection()
    try:
        with connection:
            with connection.cursor() as cursor:
                for table in TABLES:
                    qualified_table = f"public.{table}"
                    cursor.execute("SELECT to_regclass(%s)", (qualified_table,))
                    if cursor.fetchone()[0] is None:
                        raise RuntimeError(f"Missing table: {qualified_table}")
                    print(f"Table found: {qualified_table}")

                    cursor.execute(
                        "SELECT relrowsecurity FROM pg_class WHERE oid = %s::regclass",
                        (qualified_table,),
                    )
                    if not cursor.fetchone()[0]:
                        raise RuntimeError(f"RLS is not enabled: {qualified_table}")
                    print(f"RLS enabled: {qualified_table}")

                cursor.execute(
                    """
                    SELECT EXISTS (
                        SELECT 1
                        FROM pg_trigger AS trigger
                        JOIN pg_class AS relation ON relation.oid = trigger.tgrelid
                        JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
                        WHERE namespace.nspname = 'auth'
                          AND relation.relname = 'users'
                          AND trigger.tgname = 'on_auth_user_created'
                          AND NOT trigger.tgisinternal
                    )
                    """
                )
                if not cursor.fetchone()[0]:
                    raise RuntimeError("Missing trigger: auth.users.on_auth_user_created")
                print("Trigger found: auth.users.on_auth_user_created")

                temporary_user_id = str(uuid4())
                temporary_email = f"schema-check-{temporary_user_id}@example.invalid"
                cursor.execute("SAVEPOINT trigger_check")
                try:
                    cursor.execute(
                        """
                        INSERT INTO auth.users (
                            instance_id, id, aud, role, email, encrypted_password,
                            email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                            created_at, updated_at
                        ) VALUES (
                            '00000000-0000-0000-0000-000000000000', %s,
                            'authenticated', 'authenticated', %s,
                            '$2a$10$SchemaCheckOnlyNotAUsablePasswordHash000000000000000000000',
                            now(), '{}'::jsonb, '{}'::jsonb, now(), now()
                        )
                        """,
                        (temporary_user_id, temporary_email),
                    )
                    cursor.execute(
                        "SELECT username FROM public.profiles WHERE id = %s",
                        (temporary_user_id,),
                    )
                    profile = cursor.fetchone()
                    if not profile or not profile[0]:
                        raise RuntimeError("Auth trigger did not create an anonymous profile.")
                    print("Trigger test passed: auth user created an anonymous profile")
                finally:
                    cursor.execute("ROLLBACK TO SAVEPOINT trigger_check")
    finally:
        connection.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Schema check failed: {error}")
        raise SystemExit(1)