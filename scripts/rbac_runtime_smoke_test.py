import json
import time
from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple

import bcrypt
import requests
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from backend.app.models import Company, CompanyUser, Customer, User, UserRole, get_database_url

BASE_URL = "http://127.0.0.1:8000/api"
TIMEOUT = 15


@dataclass
class FixtureContext:
    company_a_id: int
    company_b_id: int
    users: Dict[str, Dict[str, Any]]
    customer_a_id: int
    customer_b_id: int


@dataclass
class TestResult:
    role: str
    endpoint: str
    expected: str
    actual: str
    status: str


class ApiClient:
    def request(
        self,
        method: str,
        path: str,
        token: Optional[str] = None,
        company_id: Optional[int] = None,
        payload: Optional[Dict[str, Any]] = None,
    ) -> Tuple[int, Any]:
        headers: Dict[str, str] = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        if company_id is not None:
            headers["X-Company-Id"] = str(company_id)

        response = requests.request(
            method=method,
            url=f"{BASE_URL}{path}",
            headers=headers,
            json=payload,
            timeout=TIMEOUT,
        )

        try:
            body = response.json()
        except Exception:
            body = response.text
        return response.status_code, body



def create_user(db: Session, email: str, password: str, full_name: str) -> User:
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        return existing

    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user = User(email=email, full_name=full_name, password_hash=password_hash, is_active=True)
    db.add(user)
    db.flush()
    return user



def ensure_membership(db: Session, company_id: int, user_id: int, role: UserRole, percent: Decimal) -> None:
    existing = db.query(CompanyUser).filter(
        CompanyUser.company_id == company_id,
        CompanyUser.user_id == user_id,
    ).first()
    if existing:
        existing.role = role
        existing.commission_percent = percent
        return

    db.add(
        CompanyUser(
            company_id=company_id,
            user_id=user_id,
            role=role,
            commission_percent=percent,
        )
    )



def setup_base_fixtures() -> FixtureContext:
    engine = create_engine(get_database_url(), echo=False)
    db = Session(engine)
    ts = int(time.time())

    try:
        company_a = Company(name=f"RBAC Company A {ts}")
        company_b = Company(name=f"RBAC Company B {ts}")
        db.add_all([company_a, company_b])
        db.flush()

        users: Dict[str, Dict[str, Any]] = {}
        specs = [
            ("owner_a", company_a.id, UserRole.OWNER, Decimal("0.00")),
            ("accountant_a", company_a.id, UserRole.ACCOUNTANT, Decimal("15.00")),
            ("sales_a", company_a.id, UserRole.SALES, Decimal("20.00")),
            ("sales_a_other", company_a.id, UserRole.SALES, Decimal("20.00")),
            ("owner_b", company_b.id, UserRole.OWNER, Decimal("0.00")),
            ("accountant_b", company_b.id, UserRole.ACCOUNTANT, Decimal("15.00")),
            ("sales_b", company_b.id, UserRole.SALES, Decimal("20.00")),
        ]

        for key, company_id, role, pct in specs:
            email = f"{key}.{ts}@rbac.test"
            password = "Pass123!"
            user = create_user(db, email, password, key.replace("_", " ").title())
            ensure_membership(db, company_id, user.id, role, pct)
            users[key] = {
                "id": user.id,
                "email": email,
                "password": password,
                "company_id": company_id,
                "role": role.value.upper(),
            }

        customer_a = Customer(company_id=company_a.id, name=f"Customer A {ts}")
        customer_b = Customer(company_id=company_b.id, name=f"Customer B {ts}")
        db.add_all([customer_a, customer_b])
        db.commit()
        db.refresh(customer_a)
        db.refresh(customer_b)

        return FixtureContext(
            company_a_id=company_a.id,
            company_b_id=company_b.id,
            users=users,
            customer_a_id=customer_a.id,
            customer_b_id=customer_b.id,
        )
    finally:
        db.close()



def authenticate(client: ApiClient, email: str, password: str) -> str:
    code, body = client.request("POST", "/auth/login", payload={"email": email, "password": password})
    if code != 200 or not isinstance(body, dict) or "token" not in body:
        raise RuntimeError(f"Login failed for {email}: {code} {body}")
    return str(body["token"])



def expected_match(expected: str, code: int) -> bool:
    if expected == "200":
        return code == 200
    if expected == "201":
        return code == 201
    if expected == "204":
        return code == 204
    if expected == "403":
        return code == 403
    if expected == "204 or 403":
        return code in {204, 403}
    if expected == "403 or empty":
        return code in {403, 200}
    return False



def mk(role: str, endpoint: str, expected: str, code: int) -> TestResult:
    return TestResult(role, endpoint, expected, str(code), "PASS" if expected_match(expected, code) else "FAIL")



def run_tests() -> Tuple[List[TestResult], Dict[str, Any]]:
    client = ApiClient()
    fixture = setup_base_fixtures()

    tokens = {k: authenticate(client, v["email"], v["password"]) for k, v in fixture.users.items()}

    owner_a = fixture.users["owner_a"]
    accountant_a = fixture.users["accountant_a"]
    sales_a = fixture.users["sales_a"]

    def create_invoice(token_key: str, company_id: int, customer_id: int, number: str, status: str, total: int, sold_by: int) -> int:
        code, body = client.request(
            "POST",
            "/invoices",
            token=tokens[token_key],
            company_id=company_id,
            payload={
                "company_id": company_id,
                "customer_id": customer_id,
                "invoice_number": number,
                "status": status,
                "total_amount": total,
                "sold_by_user_id": sold_by,
            },
        )
        if code != 201 or not isinstance(body, dict):
            raise RuntimeError(f"fixture invoice create failed {token_key} {code} {body}")
        return int(body["id"])

    ts = int(time.time())
    inv_a_draft = create_invoice("owner_a", owner_a["company_id"], fixture.customer_a_id, f"A-DRAFT-{ts}", "draft", 100, fixture.users["sales_a"]["id"])
    inv_a_paid = create_invoice("owner_a", owner_a["company_id"], fixture.customer_a_id, f"A-PAID-{ts}", "paid", 200, fixture.users["sales_a"]["id"])
    inv_a_other = create_invoice("owner_a", owner_a["company_id"], fixture.customer_a_id, f"A-OTHER-{ts}", "draft", 250, fixture.users["sales_a_other"]["id"])
    _inv_b_draft = create_invoice("owner_b", fixture.users["owner_b"]["company_id"], fixture.customer_b_id, f"B-DRAFT-{ts}", "draft", 300, fixture.users["sales_b"]["id"])

    def create_commission(invoice_id: int, user_id: int, amount: int) -> int:
        code, body = client.request(
            "POST",
            "/commissions",
            token=tokens["owner_a"],
            company_id=owner_a["company_id"],
            payload={
                "invoice_id": invoice_id,
                "user_id": user_id,
                "percent": 20,
                "commission_amount": amount,
            },
        )
        if code != 201 or not isinstance(body, dict):
            raise RuntimeError(f"fixture commission create failed {code} {body}")
        return int(body["id"])

    commission_own = create_commission(inv_a_draft, fixture.users["sales_a"]["id"], 20)
    commission_other = create_commission(inv_a_other, fixture.users["sales_a_other"]["id"], 50)

    results: List[TestResult] = []
    cross_company_leakage: List[str] = []

    code, body = client.request("GET", f"/invoices?company_id={fixture.company_b_id}", token=tokens["owner_a"], company_id=fixture.company_b_id)
    if code == 200 and isinstance(body, list) and body:
        cross_company_leakage.append("owner_a accessed company_b invoices")
    results.append(mk("OWNER(A)", "GET /invoices cross-company", "403 or empty", code))

    code, _ = client.request("POST", "/invoices", token=tokens["owner_a"], company_id=owner_a["company_id"], payload={"company_id": owner_a["company_id"], "customer_id": fixture.customer_a_id, "invoice_number": f"OWN-CREATE-{ts}", "status": "draft", "total_amount": 123, "sold_by_user_id": fixture.users["sales_a"]["id"]})
    results.append(mk("OWNER(A)", "POST /invoices", "201", code))

    code, _ = client.request("POST", f"/invoices/{inv_a_draft}/lock", token=tokens["owner_a"], company_id=owner_a["company_id"])
    results.append(mk("OWNER(A)", "POST /invoices/{id}/lock", "200", code))

    code, _ = client.request("PUT", f"/invoices/{inv_a_draft}", token=tokens["owner_a"], company_id=owner_a["company_id"], payload={"total_amount": 111})
    results.append(mk("OWNER(A)", "PUT locked invoice", "200", code))

    code, _ = client.request("POST", f"/invoices/{inv_a_draft}/unlock", token=tokens["owner_a"], company_id=owner_a["company_id"])
    results.append(mk("OWNER(A)", "POST /invoices/{id}/unlock", "200", code))

    code, _ = client.request("DELETE", f"/invoices/{inv_a_paid}", token=tokens["owner_a"], company_id=owner_a["company_id"])
    results.append(mk("OWNER(A)", "DELETE paid invoice", "204 or 403", code))

    code, _ = client.request("PUT", f"/invoices/{inv_a_other}", token=tokens["accountant_a"], company_id=accountant_a["company_id"], payload={"total_amount": 333})
    results.append(mk("ACCOUNTANT(A)", "PUT draft invoice", "200", code))

    client.request("POST", f"/invoices/{inv_a_other}/lock", token=tokens["owner_a"], company_id=owner_a["company_id"])
    code, _ = client.request("PUT", f"/invoices/{inv_a_other}", token=tokens["accountant_a"], company_id=accountant_a["company_id"], payload={"total_amount": 444})
    results.append(mk("ACCOUNTANT(A)", "PUT locked invoice", "403", code))

    code, body = client.request("POST", "/invoices", token=tokens["owner_a"], company_id=owner_a["company_id"], payload={"company_id": owner_a["company_id"], "customer_id": fixture.customer_a_id, "invoice_number": f"ACC-PAID-{ts}", "status": "paid", "total_amount": 500, "sold_by_user_id": fixture.users["sales_a"]["id"]})
    paid_for_acc = body.get("id") if isinstance(body, dict) else None
    code_del_acc = 500
    if paid_for_acc:
        code_del_acc, _ = client.request("DELETE", f"/invoices/{paid_for_acc}", token=tokens["accountant_a"], company_id=accountant_a["company_id"])
    results.append(mk("ACCOUNTANT(A)", "DELETE paid invoice", "403", code_del_acc))

    code, _ = client.request("PUT", f"/invoices/{inv_a_draft}", token=tokens["sales_a"], company_id=sales_a["company_id"], payload={"total_amount": 777})
    results.append(mk("SALES(A)", "PUT any invoice", "403", code))

    code, _ = client.request("GET", f"/invoices/{inv_a_draft}", token=tokens["sales_a"], company_id=sales_a["company_id"])
    results.append(mk("SALES(A)", "GET own invoice", "200", code))

    code, _ = client.request("GET", f"/invoices/{inv_a_other}", token=tokens["sales_a"], company_id=sales_a["company_id"])
    results.append(mk("SALES(A)", "GET other sales invoice", "403", code))

    code, _ = client.request("POST", f"/commissions/{commission_own}/approve", token=tokens["owner_a"], company_id=owner_a["company_id"])
    results.append(mk("OWNER(A)", "POST /commissions/{id}/approve", "200", code))

    code, _ = client.request("POST", f"/commissions/{commission_own}/mark-paid", token=tokens["owner_a"], company_id=owner_a["company_id"])
    results.append(mk("OWNER(A)", "POST /commissions/{id}/mark-paid", "200", code))

    code, _ = client.request("POST", f"/commissions/{commission_other}/approve", token=tokens["accountant_a"], company_id=accountant_a["company_id"])
    results.append(mk("ACCOUNTANT(A)", "POST /commissions/{id}/approve", "403", code))

    code, _ = client.request("POST", f"/commissions/{commission_other}/mark-paid", token=tokens["accountant_a"], company_id=accountant_a["company_id"])
    results.append(mk("ACCOUNTANT(A)", "POST /commissions/{id}/mark-paid", "403", code))

    code, _ = client.request("GET", "/commissions", token=tokens["accountant_a"], company_id=accountant_a["company_id"])
    results.append(mk("ACCOUNTANT(A)", "GET /commissions", "200", code))

    code, _ = client.request("GET", f"/commissions/{commission_own}", token=tokens["sales_a"], company_id=sales_a["company_id"])
    results.append(mk("SALES(A)", "GET own commission", "200", code))

    code, _ = client.request("GET", f"/commissions/{commission_other}", token=tokens["sales_a"], company_id=sales_a["company_id"])
    results.append(mk("SALES(A)", "GET other commission", "403", code))

    code, _ = client.request("PUT", f"/commissions/{commission_own}", token=tokens["sales_a"], company_id=sales_a["company_id"], payload={"commission_amount": 999})
    results.append(mk("SALES(A)", "PUT commission status/amount", "403", code))

    code, body = client.request("POST", "/customers", token=tokens["owner_a"], company_id=owner_a["company_id"], payload={"company_id": owner_a["company_id"], "name": f"Owner CRUD {ts}"})
    results.append(mk("OWNER(A)", "POST /customers", "201", code))
    owner_cid = body.get("id") if isinstance(body, dict) else None
    code_upd = 500
    code_del = 500
    if owner_cid:
        code_upd, _ = client.request("PUT", f"/customers/{owner_cid}", token=tokens["owner_a"], company_id=owner_a["company_id"], payload={"name": "Owner Updated"})
        code_del, _ = client.request("DELETE", f"/customers/{owner_cid}", token=tokens["owner_a"], company_id=owner_a["company_id"])
    results.append(mk("OWNER(A)", "PUT /customers/{id}", "200", code_upd))
    results.append(mk("OWNER(A)", "DELETE /customers/{id}", "204", code_del))

    code, body = client.request("POST", "/customers", token=tokens["accountant_a"], company_id=accountant_a["company_id"], payload={"company_id": accountant_a["company_id"], "name": f"Acc CRUD {ts}"})
    results.append(mk("ACCOUNTANT(A)", "POST /customers", "201", code))
    acc_cid = body.get("id") if isinstance(body, dict) else None
    code_upd = 500
    code_del = 500
    if acc_cid:
        code_upd, _ = client.request("PUT", f"/customers/{acc_cid}", token=tokens["accountant_a"], company_id=accountant_a["company_id"], payload={"name": "Acc Updated"})
        code_del, _ = client.request("DELETE", f"/customers/{acc_cid}", token=tokens["accountant_a"], company_id=accountant_a["company_id"])
    results.append(mk("ACCOUNTANT(A)", "PUT /customers/{id}", "200", code_upd))
    results.append(mk("ACCOUNTANT(A)", "DELETE /customers/{id}", "204", code_del))

    code, _ = client.request("POST", "/customers", token=tokens["sales_a"], company_id=sales_a["company_id"], payload={"company_id": sales_a["company_id"], "name": "Sales Should Fail"})
    results.append(mk("SALES(A)", "POST /customers", "403", code))

    code, _ = client.request("PUT", f"/customers/{fixture.customer_a_id}", token=tokens["sales_a"], company_id=sales_a["company_id"], payload={"name": "Sales Update"})
    results.append(mk("SALES(A)", "PUT /customers/{id}", "403", code))

    code, _ = client.request("DELETE", f"/customers/{fixture.customer_a_id}", token=tokens["sales_a"], company_id=sales_a["company_id"])
    results.append(mk("SALES(A)", "DELETE /customers/{id}", "403", code))

    code, _ = client.request("GET", f"/customers?company_id={sales_a['company_id']}", token=tokens["sales_a"], company_id=sales_a["company_id"])
    results.append(mk("SALES(A)", "GET /customers", "200", code))

    code, _ = client.request("GET", "/audit-logs", token=tokens["owner_a"], company_id=owner_a["company_id"])
    results.append(mk("OWNER(A)", "GET /audit-logs", "200", code))

    code, _ = client.request("GET", "/audit-logs", token=tokens["accountant_a"], company_id=accountant_a["company_id"])
    results.append(mk("ACCOUNTANT(A)", "GET /audit-logs", "200", code))

    code, _ = client.request("GET", "/audit-logs", token=tokens["sales_a"], company_id=sales_a["company_id"])
    results.append(mk("SALES(A)", "GET /audit-logs", "403", code))

    code, body = client.request("GET", f"/customers?company_id={fixture.company_b_id}", token=tokens["accountant_a"], company_id=fixture.company_b_id)
    if code == 200 and isinstance(body, list) and body:
        cross_company_leakage.append("accountant_a accessed company_b customers")
    results.append(mk("ACCOUNTANT(A)", "GET /customers cross-company", "403 or empty", code))

    unexpected_200 = [r for r in results if r.actual == "200" and r.expected not in {"200", "403 or empty"}]
    unexpected_403 = [r for r in results if r.actual == "403" and r.expected not in {"403", "204 or 403", "403 or empty"}]
    missing_enforcement = [r for r in results if r.expected == "403" and r.actual != "403"]

    summary = {
        "total": len(results),
        "passed": sum(1 for r in results if r.status == "PASS"),
        "failed": sum(1 for r in results if r.status == "FAIL"),
        "unexpected_200": [f"{r.role} {r.endpoint} -> {r.actual}" for r in unexpected_200],
        "unexpected_403": [f"{r.role} {r.endpoint} -> {r.actual}" for r in unexpected_403],
        "cross_company_leakage": cross_company_leakage,
        "missing_permission_enforcement": [f"{r.role} {r.endpoint} expected 403 got {r.actual}" for r in missing_enforcement],
    }

    return results, summary



def print_report(results: List[TestResult], summary: Dict[str, Any]) -> None:
    print("Role | Endpoint | Expected | Actual | PASS/FAIL")
    print("--- | --- | --- | --- | ---")
    for r in results:
        print(f"{r.role} | {r.endpoint} | {r.expected} | {r.actual} | {r.status}")

    print("\n=== SUMMARY ===")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    res, summ = run_tests()
    print_report(res, summ)
