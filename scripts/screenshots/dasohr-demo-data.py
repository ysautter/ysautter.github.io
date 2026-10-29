"""Fictional demo data for portfolio screenshots. Run: manage.py shell < this file."""
from datetime import date, time, timedelta

from django.utils import timezone

from accounts.models import TeacherProfile, User
from audit.context import actor_override
from invoicing import services as inv
from lessons import records
from lessons.models import Lesson
from lessons.schemas import LessonStatusIn
from lessons.services import ensure_lessons_generated
from school import services as school
from school.models import Instrument, SchoolSettings
from school.schemas import HolidayIn, InstrumentCreateIn, PriceIn, SchoolSettingsIn
from students.schemas import EnrolmentIn
from students.enrolment import enrol

maria = User.objects.get(email="admin-lehrerin@das-ohr.test")
lukas = User.objects.get(email="lehrer@das-ohr.test")
tina = User.objects.get(email="teacher@das-ohr.test")
anna = User.objects.get(email="admin@das-ohr.test")

with actor_override(anna):
    s = SchoolSettings.load()
    school.update_school_settings(SchoolSettingsIn(
        name="das Ohr Musikschule", street="Beispielweg 12", zip_code="50667", city="Köln",
        lesson_vat_note=s.lesson_vat_note or "Umsatzsteuerfrei gemäß § 4 Nr. 21 UStG",
        kleinunternehmer_note=s.kleinunternehmer_note or "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.",
        invoice_delivery_mode="in_app", invoice_delivery_email="",
        default_task_approval_required=True, task_vat_rate="19.00",
        substitute_rate_source="substitute", lesson_generation_weeks_ahead=8,
    ))

    inst = {}
    for de, en in [("Klavier", "Piano"), ("Gitarre", "Guitar"), ("Geige", "Violin"),
                   ("Gesang", "Voice"), ("Schlagzeug", "Drums")]:
        inst[de] = Instrument.objects.filter(name_de=de).first() or school.create_instrument(
            InstrumentCreateIn(name_de=de, name_en=en))

    if not school.visible_prices(anna).exists():
        for valid_from, bump in [(date(2026, 1, 1), 0), (date(2027, 1, 1), 300)]:
            for d, fee, rate in [(30, 8900, 2200), (45, 11900, 3100), (60, 14900, 4000)]:
                school.create_price(PriceIn(kind="student_monthly_fee", lesson_type="single",
                                            duration_minutes=d, amount_cents=fee + bump, valid_from=valid_from))
                school.create_price(PriceIn(kind="teacher_lesson_rate", lesson_type="single",
                                            duration_minutes=d, amount_cents=rate + bump // 3, valid_from=valid_from))
            school.create_price(PriceIn(kind="student_monthly_fee", lesson_type="group",
                                        duration_minutes=45, amount_cents=6900 + bump, valid_from=valid_from))
            school.create_price(PriceIn(kind="teacher_lesson_rate", lesson_type="group",
                                        duration_minutes=45, amount_cents=3600 + bump // 3, valid_from=valid_from))
            school.create_price(PriceIn(kind="task_hourly_rate", amount_cents=2500 + bump // 3,
                                        valid_from=valid_from))
        school.create_price(PriceIn(kind="teacher_lesson_rate", lesson_type="single", duration_minutes=45,
                                    teacher_id=maria.pk, amount_cents=3300, valid_from=date(2026, 9, 1)))
        school.create_holiday(HolidayIn(name="Weihnachtsferien", start_date=date(2026, 12, 23),
                                        end_date=date(2027, 1, 6)))
        school.create_holiday(HolidayIn(name="Tag der Deutschen Einheit", start_date=date(2026, 10, 3),
                                        end_date=date(2026, 10, 3)))

for u, street, holder in [(maria, "Notenweg 3", "Maria Musik"), (lukas, "Saitenstraße 8", "Lukas Lehrer"),
                          (tina, "Bogenallee 21", "Tina Teacher")]:
    TeacherProfile.objects.filter(user=u).update(
        street=street, zip_code="50667", city="Köln", phone="0221 000000",
        tax_number="214/5000/0000", iban="DE89370400440532013000", bic="COBADEFFXXX",
        account_holder=holder, is_kleinunternehmer=True)

START = date(2026, 9, 1)
# teacher, instrument, weekday (1=Mon), time, minutes, type, group name, students
PLAN = [
    (maria, "Klavier", 1, time(14, 0), 30, "single", "", [("Emma", "Schneider", 2016)]),
    (maria, "Klavier", 1, time(14, 30), 45, "single", "", [("Paul", "Fischer", 2012)]),
    (maria, "Klavier", 1, time(15, 15), 45, "single", "", [("Mia", "Weber", 2014)]),
    (maria, "Klavier", 1, time(16, 0), 45, "group", "Klavier Gruppe Anfänger",
     [("Leon", "Wagner", 2017), ("Ella", "Becker", 2017), ("Ben", "Hoffmann", 2016)]),
    (maria, "Klavier", 1, time(17, 0), 60, "single", "", [("Lina", "Schäfer", 2008)]),
    (maria, "Gesang", 1, time(18, 0), 45, "single", "", [("Clara", "Richter", 1994)]),
    (maria, "Klavier", 3, time(15, 0), 45, "single", "", [("Noah", "Koch", 2013)]),
    (maria, "Klavier", 3, time(16, 0), 30, "single", "", [("Sophie", "Wolf", 2018)]),
    (lukas, "Gitarre", 2, time(15, 0), 45, "single", "", [("Felix", "Klein", 2011)]),
    (lukas, "Gitarre", 2, time(16, 0), 45, "group", "Gitarre Gruppe",
     [("Jonas", "Neumann", 2010), ("Lea", "Schwarz", 2010)]),
    (lukas, "Schlagzeug", 4, time(17, 0), 60, "single", "", [("Tim", "Zimmermann", 2007)]),
    (tina, "Geige", 2, time(14, 30), 45, "single", "", [("Marie", "Braun", 2013)]),
    (tina, "Geige", 4, time(15, 30), 30, "single", "", [("Anton", "Krüger", 2017)]),
]

if not Lesson.objects.exists():
    for teacher, instr, wd, t, mins, typ, name, students in PLAN:
        series_id = None
        for first, last, year in students:
            body = dict(start_date=START, student=dict(first_name=first, last_name=last,
                                                       date_of_birth=date(year, 3, 14)))
            if series_id is None:
                body["series"] = dict(instrument_id=inst[instr].pk, lesson_type=typ, duration_minutes=mins,
                                      weekday=wd, start_time=t, name=name)
            else:
                body["series_id"] = series_id
            with actor_override(teacher):
                c = enrol(teacher, EnrolmentIn(**body))
            series_id = c.series_id
    ensure_lessons_generated()

# Record all past lessons: mostly held, a few cancelled by the student.
now = timezone.now()
cancel_every = 0
for lesson in Lesson.objects.filter(scheduled_at__lt=now, status="scheduled").order_by("scheduled_at"):
    cancel_every += 1
    status = "cancelled_by_student" if cancel_every % 11 == 0 and lesson.lesson_type == "single" else "held"
    with actor_override(lesson.teacher):
        records.set_status(lesson.teacher, str(lesson.pk), LessonStatusIn(status=status))

# September invoices: submitted, two approved by the admin, one paid.
from invoicing.models import Invoice
if not Invoice.objects.exists():
    for t in (maria, lukas, tina):
        with actor_override(t):
            draft, _ = inv.create_draft(t, 2026, 9)
            inv.submit_invoice(t, str(draft.pk))
    with actor_override(anna):
        for t in (lukas, tina):
            i = Invoice.objects.get(teacher=t)
            inv.approve_invoice(anna, str(i.pk))
        inv.mark_paid(anna, str(Invoice.objects.get(teacher=tina).pk))

print("lessons", Lesson.objects.count(), "held", Lesson.objects.filter(status="held").count(),
      "invoices", list(Invoice.objects.values_list("invoice_number", "status", "gross_cents")))
