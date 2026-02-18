import psycopg

# اتصال به دیتابیس با رمز جدید
conn = psycopg.connect(
    host="localhost",
    port=5432,
    user="postgres",
    password="Adadep1625",
    dbname="rr_accounting"
)

# اگه بدون خطا اجرا شد، اتصال برقرار شد
print("Connected successfully!")

# بستن اتصال
conn.close()
python