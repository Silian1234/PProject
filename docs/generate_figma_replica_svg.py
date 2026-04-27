from __future__ import annotations
from pathlib import Path
import html
import textwrap

OUT = Path(r"C:\Users\Silian\PycharmProjects\PProject\docs\figma_editable_replica.svg")
C = {
    "bg": "#e9edf5", "card": "#f8f9fb", "hero": "#dfe7f7", "stroke": "#cbd6ea",
    "stroke_soft": "#dbe4f4", "text": "#162c57", "muted": "#64758f", "blue": "#2a55d7",
    "green_soft": "#cae8d8", "green_text": "#2d854d", "green_stroke": "#57b77e",
    "orange": "#d07a00", "orange_soft": "#ffe6c1", "violet": "#7543f0", "input": "#f3f6fb",
    "white": "#ffffff"
}
parts: list[str] = []

def esc(s: object) -> str:
    return html.escape(str(s), quote=True)

def rect(x,y,w,h,fill=None,stroke=None,r=0, name="rect"):
    fill = fill or C["card"]
    stroke_attr = f' stroke="{stroke}" stroke-width="1"' if stroke else ''
    parts.append(f'<rect id="{esc(name)}" x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"{stroke_attr}/>')

def line(x1,y1,x2,y2,stroke=None,name="line"):
    parts.append(f'<line id="{esc(name)}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke or C["stroke"]}" stroke-width="1"/>')

def text(x,y,s,size=16,fill=None,weight=400,width=None,line_height=1.28,name="text"):
    fill = fill or C["text"]
    weight_attr = weight
    if width:
        avg = max(size * 0.54, 7)
        chars = max(8, int(width / avg))
        lines=[]
        for para in str(s).split("\n"):
            lines.extend(textwrap.wrap(para, chars) or [""])
    else:
        lines = str(s).split("\n")
    parts.append(f'<text id="{esc(name)}" x="{x}" y="{y}" font-family="Segoe UI, Arial, sans-serif" font-size="{size}" font-weight="{weight_attr}" fill="{fill}">')
    for i,ln in enumerate(lines):
        dy = 0 if i==0 else size*line_height
        parts.append(f'<tspan x="{x}" dy="{dy}">{esc(ln)}</tspan>')
    parts.append('</text>')

def button(x,y,w,h,label,primary=True,name="button"):
    rect(x,y,w,h,C["blue"] if primary else "none",C["blue"],10,name+" bg")
    text(x+14,y+h/2+5,label,16,C["white"] if primary else C["blue"],600,w-28,1.05,name+" label")

def pill(x,y,w,label,kind="green",name="pill"):
    if kind=="green": fill,stroke,color=C["green_soft"],C["green_stroke"],C["green_text"]
    elif kind=="orange": fill,stroke,color=C["orange_soft"],"#f0ab54",C["orange"]
    elif kind=="violet": fill,stroke,color="none","#9e7ef4",C["violet"]
    else: fill,stroke,color="#d6e0f7","#d6e0f7",C["blue"]
    rect(x,y,w,28,fill,stroke,14,name+" bg")
    text(x+12,y+19,label,14,color,600,w-24,1.0,name+" label")

def input_box(x,y,w,h,label,placeholder="",name="input"):
    text(x,y,label,14,C["text"],400,w,1.1,name+" label")
    rect(x,y+22,w,h,C["card"],C["stroke"],10,name+" field")
    if placeholder:
        text(x+12,y+47,placeholder,14,C["muted"],400,w-24,1.1,name+" placeholder")

def info(x,y,w,label,value,name="info"):
    rect(x,y,w,64,C["input"],C["stroke_soft"],10,name+" bg")
    text(x+12,y+23,label,13,C["muted"],400,w-24,1.0,name+" label")
    text(x+12,y+47,value,14,C["text"],700,w-24,1.0,name+" value")

def frame_start(x,y,w,h,name):
    parts.append(f'<g id="{esc(name)}" transform="translate({x},{y})">')
    rect(0,0,w,h,C["bg"],None,0,name+" background")

def frame_end():
    parts.append('</g>')

def topbar(mode="public", active="Главная"):
    rect(16,14,1208,50,C["card"],C["stroke"],14,"topbar")
    text(30,48,"PProject",24,C["text"],700,140,1,"logo")
    links = ["Главная","Вакансии"] if mode=="public" else (["Главная","Вакансии","Панель","Профиль"] if mode=="employer" else ["Главная","Вакансии","Мои заявки","Профиль"])
    x=180
    for l in links:
        text(x,45,l,18,C["blue"] if l==active else C["text"],700 if l==active else 400,120,1,f"nav {l}")
        x += 128 if len(l)>8 else 98
    rx=878
    for lang in ["RU","EN","DE"]:
        rect(rx,22,56,34,"none",C["stroke"],9,f"lang {lang}")
        text(rx+16,44,lang,14,C["blue"] if lang=="RU" else C["muted"],700 if lang=="RU" else 400,32,1,f"lang text {lang}")
        rx += 64
    if mode == "public":
        button(1082,21,58,36,"Вход",False,"login")
        button(1146,21,66,36,"Регистрация",False,"register")
    else:
        button(1140,21,72,36,"Выход",False,"logout")

def footer(y=828,w=1208):
    rect(16,y,w,50,C["card"],C["stroke"],14,"footer")
    text(32,y+32,"PProject",14,C["text"],700,90,1,"footer brand")
    text(140,y+32,"Работа и стажировки для студентов",14,C["muted"],400,320,1,"footer desc")
    text(w-256,y+32,"Контакты: example@gmail.com",14,C["blue"],600,240,1,"footer mail")

def vacancy_card(x,y,w,v,name):
    rect(x,y,w,238,C["card"],C["stroke"],14,name+" card")
    text(x+16,y+42,v["title"],24,C["text"],700,w-260,1.1,name+" title")
    text(x+16,y+74,v["description"],16,C["muted"],400,w-260,1.25,name+" desc")
    pill(x+w-210,y+18,110,"активна","green",name+" status")
    button(x+w-88,y+14,74,36,"Открыть",True,name+" open")
    items=[("Подразделение",v["department"]),("Работодатель","University Career Center"),("Тип занятости",v["type"]),("Локация",v["location"]),("Занятость",v["workload"]),("Оплата",v["salary"]),("Дедлайн подачи",v["deadline"])]
    item_w=(w-62)/4
    for i,(a,b) in enumerate(items):
        info(x+16+(i%4)*(item_w+10),y+92+(i//4)*74,item_w,a,b,name+f" info {i}")

vacancies=[
{"title":"Стажер-аналитик данных","description":"Работайте с исследовательскими командами над опросами, лабораторными и учебными данными.","department":"Офис исследовательских проектов","type":"Стажировка","location":"Офис исследовательских проектов","workload":"16 часов/неделю","salary":"600.00 - 850.00","deadline":"Не указано","responsibilities":"Очищать наборы данных, готовить дашборды и резюмировать выводы для руководителей проектов.","requirements":"Опыт Python или таблиц, внимательность и интерес к прикладным исследованиям."},
{"title":"Ассистент IT-поддержки","description":"Помогайте студентам и сотрудникам решать повседневные IT-задачи в кампусе.","department":"Кафедра компьютерных наук","type":"Стажировка","location":"IT-служба главного кампуса","workload":"20 часов/неделю","salary":"500.00 - 700.00","deadline":"05.05.2026","responsibilities":"Обрабатывать обращения, готовить оборудование аудиторий и описывать повторяющиеся проблемы.","requirements":"Базовые знания Windows, сетей и навыки коммуникации."},
{"title":"Помощник библиотечной службы","description":"Поддерживайте команду библиотеки во время вечерних часов обслуживания студентов.","department":"Университетская библиотека","type":"Частичная занятость","location":"Университетская библиотека","workload":"12 часов/неделю","salary":"350.00 - 450.00","deadline":"Не указано","responsibilities":"Помогать посетителям, разбирать возвращенные книги и работать с запросами к электронному каталогу.","requirements":"Внимательность, вежливое общение и готовность к вечерним сменам."},
]

# SVG root
parts.append('<svg xmlns="http://www.w3.org/2000/svg" width="8080" height="3000" viewBox="0 0 8080 3000">')
parts.append('<defs><style>text{white-space:pre;font-family:Segoe UI,Arial,sans-serif;} rect,line,text{vector-effect:non-scaling-stroke;}</style></defs>')
rect(0,0,8080,3000,"#f2f4f8",None,0,"canvas background")

# Desktop home
frame_start(80,80,1240,900,"Desktop Home")
topbar("public","Главная"); footer()
text(24,128,"Главная",46,C["text"],800,520,1.05,"title")
rect(24,154,820,210,C["hero"],C["stroke"],14,"hero")
text(44,214,"Находите работу и стажировки в университете быстрее",32,C["text"],700,720,1.12,"hero title")
text(44,288,"Единая платформа для студентов, подразделений и партнёрских работодателей.",16,C["muted"],400,720,1.25,"hero subtitle")
button(44,310,170,40,"Смотреть вакансии",True,"browse")
button(226,310,170,40,"Для работодателей",False,"employer")
rect(862,154,354,210,C["card"],C["stroke"],14,"stats")
text(882,204,"Быстрая статистика",24,C["text"],700,300,1,"stats title")
text(882,246,"7 активных вакансий",16,C["text"],400,280,1,"stats active")
text(882,280,"7 студенческих откликов",16,C["text"],400,280,1,"stats apps")
rect(24,386,1192,304,C["card"],C["stroke"],14,"featured")
text(44,438,"Рекомендуемые предложения",24,C["text"],700,520,1,"featured title")
vacancy_card(44,462,1132,vacancies[0],"featured vacancy")
frame_end()

# Desktop vacancies
frame_start(1400,80,1240,900,"Desktop Vacancies")
topbar("public","Вакансии"); footer()
text(24,128,"Список вакансий",46,C["text"],800,600,1.05,"title")
rect(24,154,650,40,C["card"],C["stroke"],10,"search")
text(38,179,"Поиск по ключевому слову, компании, роли...",16,C["muted"],400,500,1,"search placeholder")
rect(686,154,220,40,C["card"],C["stroke"],10,"department select")
text(700,179,"Все подразделения",16,C["text"],400,160,1,"department text")
rect(918,154,190,40,C["card"],C["stroke"],10,"type select")
text(932,179,"Все типы",16,C["text"],400,120,1,"type text")
button(1118,154,98,40,"Открыть",True,"filter button")
vacancy_card(24,218,1192,vacancies[0],"vacancy 1")
vacancy_card(24,470,1192,vacancies[1],"vacancy 2")
frame_end()

# Details
frame_start(2720,80,1240,900,"Desktop Vacancy Details")
topbar("student","Вакансии"); footer()
text(24,128,"Детали вакансии",46,C["text"],800,600,1.05,"title")
rect(24,154,1192,612,C["card"],C["stroke"],14,"details card")
text(44,211,vacancies[0]["title"],32,C["text"],700,880,1.1,"vacancy title")
text(44,263,"Основная информация",24,C["text"],700,520,1,"main info")
items=[("Подразделение",vacancies[0]["department"]),("Работодатель","University Career Center"),("Тип занятости",vacancies[0]["type"]),("Локация",vacancies[0]["location"]),("Занятость",vacancies[0]["workload"]),("Оплата",vacancies[0]["salary"]),("Дедлайн подачи",vacancies[0]["deadline"]),("Статус","активна")]
for i,(a,b) in enumerate(items): info(44+(i%4)*280,280+(i//4)*74,264,a,b,f"details info {i}")
text(44,478,"Описание",24,C["text"],700,1060,1,"desc title")
text(44,514,vacancies[0]["description"],16,C["text"],400,1060,1.3,"desc body")
text(44,564,"Обязанности",24,C["text"],700,1060,1,"resp title")
text(44,600,vacancies[0]["responsibilities"],16,C["text"],400,1060,1.3,"resp body")
text(44,650,"Требования",24,C["text"],700,1060,1,"req title")
text(44,686,vacancies[0]["requirements"],16,C["text"],400,1060,1.3,"req body")
button(44,704,150,40,"Откликнуться",True,"apply button")
frame_end()

# Apply, login, register
frame_start(4040,80,1240,900,"Desktop Apply")
topbar("student","Вакансии"); footer(); text(24,128,"Форма отклика",46,C["text"],800,600,1.05,"title")
rect(24,154,1192,140,C["card"],C["stroke"],14,"context")
text(44,202,"Вакансия, на которую вы откликаетесь",24,C["text"],700,620,1,"context title")
text(44,240,vacancies[0]["title"],20,C["text"],700,620,1,"context vacancy")
text(44,272,f"{vacancies[0]['department']} • {vacancies[0]['type']} • {vacancies[0]['workload']}",16,C["muted"],400,900,1,"context meta")
rect(24,314,1192,438,C["card"],C["stroke"],14,"form")
text(44,364,"Отправьте заявку",24,C["text"],700,620,1,"form title")
input_box(44,390,1120,40,"Резюме","Выберите файл или укажите ссылку","resume")
input_box(44,474,1120,120,"Сопроводительное письмо","Почему вы подходите на эту позицию?","letter")
input_box(44,626,1120,80,"Сообщение работодателю","Краткое сообщение","message")
button(44,724,170,40,"Отправить отклик",True,"submit")
button(226,724,96,40,"Отмена",False,"cancel")
frame_end()

frame_start(5360,80,1240,900,"Desktop Login")
topbar("public","Главная"); footer(); text(24,128,"Вход",46,C["text"],800,600,1.05,"title")
rect(170,166,900,360,C["card"],C["stroke"],14,"login card")
text(194,220,"Войдите в аккаунт",24,C["text"],700,420,1,"login title")
text(194,250,"Войдите, чтобы откликаться на вакансии и отслеживать статусы заявок.",14,C["muted"],400,620,1.25,"login note")
input_box(194,282,852,40,"Логин или email","student@example.edu","login user")
input_box(194,366,852,40,"Пароль","Введите пароль","login pass")
button(194,462,120,40,"Войти",True,"login submit")
button(326,462,150,40,"Создать аккаунт",False,"login register")
frame_end()

frame_start(6680,80,1240,900,"Desktop Register")
topbar("public","Главная"); footer(); text(24,128,"Регистрация",46,C["text"],800,600,1.05,"title")
rect(120,152,1000,560,C["card"],C["stroke"],14,"register card")
text(144,204,"Создайте студенческий аккаунт",24,C["text"],700,620,1,"register title")
text(144,232,"После регистрации можно откликаться на вакансии и редактировать профиль.",14,C["muted"],400,760,1.2,"register note")
input_box(144,260,460,40,"Предпочитаемый язык","Русский","reg lang")
input_box(628,260,468,40,"Логин","anna.kovalenko","reg login")
input_box(144,344,460,40,"Email","student@example.edu","reg email")
input_box(628,344,468,40,"Имя","Анна","reg first")
input_box(144,428,460,40,"Фамилия","Коваленко","reg last")
input_box(628,428,468,40,"Пароль","Минимум 8 символов","reg pass")
input_box(144,512,460,40,"Подтвердите пароль","Повторите пароль","reg confirm")
button(144,620,170,40,"Создать аккаунт",True,"reg submit")
button(326,620,150,40,"Назад ко входу",False,"reg back")
frame_end()

# Second row: profile, applications, admin
frame_start(80,1060,1240,900,"Desktop Employer Profile")
topbar("employer","Профиль"); footer(); text(24,128,"Профиль",46,C["text"],800,600,1.05,"title")
rect(24,154,386,310,C["card"],C["stroke"],14,"profile card")
text(44,209,"Marta Reed",32,C["text"],700,320,1,"profile name")
text(44,245,"Email: career.center@example.edu\nРоль: Работодатель\nПредпочитаемый язык: Английский\nНазвание организации: University Career Center\nДолжность: Recruitment Coordinator\nПодразделение: Кафедра компьютерных наук",16,C["text"],400,320,1.55,"profile meta")
rect(430,154,786,310,C["card"],C["stroke"],14,"actions card")
text(454,211,"Быстрые действия",32,C["text"],700,420,1,"actions title")
button(454,238,170,40,"Смотреть вакансии",True,"view vacancies")
button(638,238,260,40,"Открыть панель работодателя",False,"open admin")
rect(24,488,1192,300,C["card"],C["stroke"],14,"edit card")
text(44,535,"Редактировать профиль работодателя",24,C["text"],700,620,1,"edit title")
for i,(lab,val) in enumerate([("Имя","Marta"),("Фамилия","Reed"),("Предпочитаемый язык","English"),("Название организации","University Career Center"),("Должность","Recruitment Coordinator"),("Подразделение","Кафедра компьютерных наук")]):
    input_box(44+(i%3)*384,558+(i//3)*84,360,40,lab,val,f"profile input {i}")
button(44,736,170,40,"Сохранить профиль",True,"save profile")
frame_end()

frame_start(1400,1060,1240,900,"Desktop Student Applications")
topbar("student","Мои заявки"); footer(); text(24,128,"Кабинет студента / Мои заявки",46,C["text"],800,760,1.05,"title")
rect(24,154,360,520,C["card"],C["stroke"],14,"student profile")
text(44,205,"Anna Kovalenko",28,C["text"],700,300,1,"student name")
text(44,255,"Computer Science • 2 курс\nРезюме: Anna Kovalenko CV\nEmail: anna.kovalenko@example.edu",16,C["text"],400,300,1.55,"student meta")
button(44,598,190,40,"Редактировать профиль",False,"edit student")
rect(408,154,808,520,C["card"],C["stroke"],14,"applications card")
text(432,210,"Мои заявки",28,C["text"],700,420,1,"apps title")
for i,v in enumerate(vacancies):
    y=226+i*126
    rect(432,y,736,104,C["card"],C["stroke"],12,f"app row {i}")
    text(450,y+38,v["title"],20,C["text"],700,420,1,f"app title {i}")
    text(450,y+68,f"{v['department']} • {v['workload']}",14,C["muted"],400,480,1,f"app meta {i}")
    pill(978,y+18,150,["на рассмотрении","интервью","отправлена"][i],["orange","violet","blue"][i],f"app status {i}")
frame_end()

frame_start(2720,1060,1240,900,"Desktop Employer Admin")
topbar("employer","Панель"); footer(); text(24,128,"Управление вакансиями работодателя",46,C["text"],800,860,1.05,"title")
rect(24,154,380,330,C["card"],C["stroke"],14,"admin vacancies")
text(44,209,"Вакансии",28,C["text"],700,320,1,"admin list title")
for i,v in enumerate(vacancies):
    y=226+i*76
    line(44,y-12,364,y-12,C["stroke"],f"admin divider {i}")
    text(44,y+18,v["title"],16,C["text"],700,220,1,f"admin vacancy {i}")
    pill(282,y-2,82,"активна","green",f"admin vacancy status {i}")
    button(44,y+34,92,32,"Отклики",False,f"responses {i}")
    button(146,y+34,82,32,"Редакт.",False,f"edit {i}")
rect(426,154,790,330,C["card"],C["stroke"],14,"responses card")
text(450,209,"Отклики по вакансии",28,C["text"],700,420,1,"responses title")
for i,(n,email,st) in enumerate([("Anna Kovalenko","anna.kovalenko@example.edu","отправлена"),("Igor Petrov","igor.petrov@example.edu","интервью"),("Lea Muller","lea.muller@example.edu","принята")]):
    y=226+i*80
    rect(450,y,720,64,C["input"],C["stroke_soft"],12,f"response {i}")
    text(466,y+32,n,18,C["text"],700,220,1,f"response name {i}")
    text(466,y+54,email,13,C["muted"],400,260,1,f"response email {i}")
    pill(788,y+18,120,st,"green" if i==2 else ("violet" if i==1 else "blue"),f"response status {i}")
    button(1048,y+16,92,34,"Детали",False,f"details {i}")
rect(24,506,1192,300,C["card"],C["stroke"],14,"create vacancy")
text(44,556,"Создать вакансию",28,C["text"],700,420,1,"create title")
input_box(44,580,360,40,"Подразделение","Введите любое название подразделения","create department")
input_box(428,580,220,40,"Тип","Стажировка","create type")
input_box(672,580,220,40,"Статус","черновик","create status")
input_box(916,580,256,40,"Занятость (часов/неделю)","16","create workload")
rect(44,678,700,92,C["card"],C["stroke"],10,"ru localization")
text(60,690,"RU (основная версия)",14,C["text"],600,200,1,"ru legend")
text(64,730,"Название (RU)   Описание (RU)   Обязанности (RU)   Требования (RU)   Локация (RU)",14,C["muted"],400,660,1,"ru fields")
button(770,684,210,40,"Добавить локализацию EN",False,"add en")
button(994,684,210,40,"Добавить локализацию DE",False,"add de")
button(770,734,180,40,"Создать вакансию",True,"create submit")
frame_end()

# Mobile row
for idx,(name,active) in enumerate([("Mobile Home","Главная"),("Mobile Vacancies","Вакансии"),("Mobile Details","Вакансии"),("Mobile Admin","Панель")]):
    x=80+idx*440; y=2040
    frame_start(x,y,390,844,name)
    rect(10,10,370,58,C["card"],C["stroke"],14,"mobile topbar")
    text(22,52,"PProject",34,C["text"],700,160,1,"mobile logo")
    for j,lang in enumerate(["RU","EN","DE"]):
        rect(226+j*48,24,44,30,"none",C["stroke"],15,f"mobile lang {lang}")
        text(236+j*48,46,lang,16,C["blue"] if lang=="RU" else C["muted"],700 if lang=="RU" else 400,28,1,f"mobile lang text {lang}")
    text(20,123, {"Mobile Home":"Главная","Mobile Vacancies":"Список вакансий","Mobile Details":"Детали вакансии","Mobile Admin":"Управление вакансиями"}[name],34,C["text"],700,340,1.05,"mobile title")
    if name=="Mobile Home":
        text(20,158,"Рекомендуемые предложения",16,C["muted"],400,320,1,"mob subtitle")
        rect(20,174,350,42,C["card"],C["stroke"],12,"mob search")
        text(34,200,"Поиск по роли, подразделению или ключевому слову",14,C["muted"],400,312,1,"mob search text")
        rect(20,234,350,154,C["hero"],C["stroke"],14,"mob featured")
        text(34,271,"Рекомендуемая стажировка",14,"#55709d",600,280,1,"mob overline")
        text(34,318,vacancies[0]["title"],24,C["text"],700,294,1.08,"mob vacancy title")
        text(34,362,vacancies[0]["department"],16,C["text"],400,280,1,"mob vacancy dep")
        pill(34,370,110,"активна","green","mob status")
        rect(20,404,170,104,C["card"],C["stroke"],14,"mob stat 1"); text(34,458,"7",34,C["blue"],700,120,1,"mob active num"); text(34,486,"Активные вакансии",16,C["text"],400,130,1,"mob active label")
        rect(200,404,170,104,C["card"],C["stroke"],14,"mob stat 2"); text(214,458,"7",34,"#0f7f6f",700,120,1,"mob app num"); text(214,486,"студенческих откликов",16,C["text"],400,130,1,"mob app label")
    elif name=="Mobile Vacancies":
        rect(20,140,350,42,C["card"],C["stroke"],12,"mob filter search"); text(34,166,"Поиск по ключевому слову...",16,C["muted"],400,300,1,"mob filter text")
        rect(20,194,350,42,C["card"],C["stroke"],12,"mob dep"); text(34,220,"Все подразделения",16,C["text"],400,260,1,"mob dep text")
        rect(20,248,350,42,C["card"],C["stroke"],12,"mob type"); text(34,274,"Все типы",16,C["text"],400,260,1,"mob type text")
        button(20,302,350,52,"Открыть",True,"mob open")
        for i,v in enumerate(vacancies[:2]):
            yy=374+i*174
            rect(20,yy,350,158,C["card"],C["stroke"],14,f"mob vac {i}")
            text(34,yy+44,v["title"],22,C["text"],700,270,1.08,f"mob vac title {i}")
            text(34,yy+80,v["description"],15,C["muted"],400,286,1.2,f"mob vac desc {i}")
            pill(34,yy+112,110,"активна","green",f"mob vac status {i}")
            button(256,yy+106,92,42,"Открыть",True,f"mob vac btn {i}")
    elif name=="Mobile Details":
        rect(20,140,350,584,C["card"],C["stroke"],14,"mob details")
        text(34,194,vacancies[0]["title"],28,C["text"],700,286,1.08,"mob details title")
        text(34,252,"Основная информация",24,C["text"],700,280,1,"mob main")
        info(34,270,302,"Подразделение",vacancies[0]["department"],"mob info dep")
        info(34,344,302,"Работодатель","University Career Center","mob info employer")
        info(34,418,302,"Занятость",vacancies[0]["workload"],"mob info workload")
        text(34,538,"Описание",24,C["text"],700,302,1,"mob desc title")
        text(34,574,vacancies[0]["description"],16,C["text"],400,302,1.28,"mob desc")
        button(34,664,160,52,"Откликнуться",True,"mob apply")
    else:
        rect(20,148,350,214,C["card"],C["stroke"],14,"mob admin vacancies")
        text(34,194,"Вакансии",28,C["text"],700,260,1,"mob admin title")
        for i,v in enumerate(vacancies[:2]):
            yy=212+i*68
            text(34,yy+18,v["title"],16,C["text"],700,220,1,f"mob admin vac {i}")
            pill(260,yy-2,88,"активна","green",f"mob admin status {i}")
            button(34,yy+30,88,32,"Отклики",False,f"mob admin resp {i}")
        rect(20,382,350,342,C["card"],C["stroke"],14,"mob admin form")
        text(34,428,"Создать вакансию",28,C["text"],700,260,1,"mob create title")
        input_box(34,452,302,42,"Подразделение","Введите любое название","mob create dep")
        input_box(34,536,302,42,"Тип","Стажировка","mob create type")
        input_box(34,620,302,42,"Статус","черновик","mob create status")
        button(34,700,190,42,"Создать вакансию",True,"mob create submit")
    rect(10,778,370,56,C["card"],C["stroke"],16,"bottom nav")
    for j,tab in enumerate(["Главная","Вакансии","Панель","Профиль"]):
        text(26+j*88,814,tab,13,C["blue"] if tab==active else "#7385a2",600,72,1,"bottom nav "+tab)
    frame_end()

parts.append('</svg>')
OUT.write_text("\n".join(parts), encoding="utf-8")
print(OUT)
