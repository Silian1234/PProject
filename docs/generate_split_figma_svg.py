from __future__ import annotations
from pathlib import Path
import html, textwrap

BASE = Path(r"C:\Users\Silian\PycharmProjects\PProject\docs")
C = {"bg":"#e9edf5","card":"#f8f9fb","hero":"#dfe7f7","stroke":"#cbd6ea","stroke_soft":"#dbe4f4","text":"#162c57","muted":"#64758f","blue":"#2a55d7","green_soft":"#cae8d8","green_text":"#2d854d","green_stroke":"#57b77e","orange":"#d07a00","orange_soft":"#ffe6c1","violet":"#7543f0","input":"#f3f6fb","white":"#ffffff"}

def build(width,height,body):
    return '\n'.join([
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        '<defs><style>text{font-family:Segoe UI,Arial,sans-serif;white-space:pre;} rect,line,text{vector-effect:non-scaling-stroke;}</style></defs>',
        body,
        '</svg>'
    ])

def esc(s): return html.escape(str(s), quote=True)
class S:
    def __init__(self): self.p=[]
    def rect(self,x,y,w,h,fill=None,stroke=None,r=0,n='rect'):
        f=fill if fill is not None else C['card']; st=f' stroke="{stroke}" stroke-width="1"' if stroke else ''
        self.p.append(f'<rect id="{esc(n)}" x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{r:.1f}" fill="{f}"{st}/>')
    def text(self,x,y,s,size=16,fill=None,weight=400,w=None,lh=1.25,n='text'):
        fill=fill or C['text']; s=str(s)
        if w:
            chars=max(8,int(w/max(size*.54,7)))
            lines=[]
            for para in s.split('\n'): lines += textwrap.wrap(para, chars) or ['']
        else: lines=s.split('\n')
        self.p.append(f'<text id="{esc(n)}" x="{x:.1f}" y="{y:.1f}" font-size="{size}" font-weight="{weight}" fill="{fill}">')
        for i,line in enumerate(lines):
            dy=0 if i==0 else size*lh
            self.p.append(f'<tspan x="{x:.1f}" dy="{dy:.1f}">{esc(line)}</tspan>')
        self.p.append('</text>')
    def line(self,x1,y1,x2,y2,stroke=None,n='line'):
        self.p.append(f'<line id="{esc(n)}" x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{stroke or C["stroke"]}" stroke-width="1"/>')
    def group(self,name): self.p.append(f'<g id="{esc(name)}">')
    def end(self): self.p.append('</g>')

def button(s,x,y,w,h,label,primary=True,n='button'):
    s.rect(x,y,w,h,C['blue'] if primary else 'none',C['blue'],10,n+' bg')
    s.text(x+14,y+h/2+5,label,14 if h<40 else 16,C['white'] if primary else C['blue'],600,w-28,1.0,n+' text')

def pill(s,x,y,w,label,kind='green',n='pill'):
    if kind=='green': fill,stroke,color=C['green_soft'],C['green_stroke'],C['green_text']
    elif kind=='orange': fill,stroke,color=C['orange_soft'],'#f0ab54',C['orange']
    elif kind=='violet': fill,stroke,color='none','#9e7ef4',C['violet']
    else: fill,stroke,color='#d6e0f7','#d6e0f7',C['blue']
    s.rect(x,y,w,28,fill,stroke,14,n+' bg'); s.text(x+12,y+19,label,14,color,600,w-24,1.0,n+' text')

def input_box(s,x,y,w,h,label,placeholder='',n='input'):
    s.text(x,y,label,14,C['text'],400,w,1.0,n+' label')
    s.rect(x,y+22,w,h,C['card'],C['stroke'],10,n+' field')
    if placeholder: s.text(x+12,y+47,placeholder,14,C['muted'],400,w-24,1.0,n+' placeholder')

def info(s,x,y,w,label,value,n='info'):
    s.rect(x,y,w,64,C['input'],C['stroke_soft'],10,n+' bg')
    s.text(x+12,y+22,label,13,C['muted'],400,w-24,1.0,n+' label')
    s.text(x+12,y+47,value,14,C['text'],700,w-24,1.0,n+' value')

def topbar(s,mode='public',active='Главная'):
    s.rect(16,14,1208,50,C['card'],C['stroke'],14,'topbar')
    s.text(30,48,'PProject',24,C['text'],700,140,1,'logo')
    links=['Главная','Вакансии'] if mode=='public' else (['Главная','Вакансии','Панель','Профиль'] if mode=='employer' else ['Главная','Вакансии','Мои заявки','Профиль'])
    x=178
    for l in links:
        s.text(x,45,l,18,C['blue'] if l==active else C['text'],700 if l==active else 400,130,1,f'nav {l}')
        x += 132 if len(l)>8 else 100
    rx=842
    for lang in ['RU','EN','DE']:
        s.rect(rx,22,56,34,'none',C['stroke'],9,f'lang {lang}')
        s.text(rx+16,44,lang,14,C['blue'] if lang=='RU' else C['muted'],700 if lang=='RU' else 400,32,1,f'lang {lang} text')
        rx += 64
    if mode=='public':
        button(s,1044,21,76,36,'Вход',False,'login')
        button(s,1128,21,86,36,'Регистрация',False,'register')
    else:
        button(s,1134,21,80,36,'Выход',False,'logout')

def footer(s,y=828):
    s.rect(16,y,1208,50,C['card'],C['stroke'],14,'footer')
    s.text(32,y+32,'PProject',14,C['text'],700,90,1,'footer brand')
    s.text(140,y+32,'Работа и стажировки для студентов',14,C['muted'],400,330,1,'footer desc')
    s.text(956,y+32,'Контакты: example@gmail.com',14,C['blue'],600,240,1,'footer mail')

def desktop_frame(s,x,y,name,active='Главная',mode='public'):
    s.group(name); s.p.append(f'<g transform="translate({x},{y})">')
    s.rect(0,0,1240,900,C['bg'],None,0,name+' bg')
    topbar(s,mode,active); footer(s)
    return lambda: (s.end(), s.end())

def mobile_top(s):
    s.rect(10,10,370,58,C['card'],C['stroke'],14,'topbar')
    s.text(22,52,'PProject',34,C['text'],700,160,1,'logo')
    for i,lang in enumerate(['RU','EN','DE']):
        x=226+i*48; s.rect(x,24,44,30,'none',C['stroke'],15,f'lang {lang}'); s.text(x+10,46,lang,16,C['blue'] if lang=='RU' else C['muted'],700 if lang=='RU' else 400,28,1,f'lang text {lang}')

def mobile_nav(s,active):
    s.rect(10,778,370,56,C['card'],C['stroke'],16,'bottom nav')
    for i,t in enumerate(['Главная','Вакансии','Панель','Профиль']):
        s.text(26+i*88,814,t,13,C['blue'] if t==active else '#7385a2',600,72,1,'tab '+t)

def mobile_frame(s,x,y,name,active='Главная'):
    s.group(name); s.p.append(f'<g transform="translate({x},{y})">')
    s.rect(0,0,390,844,C['bg'],None,0,name+' bg')
    mobile_top(s); mobile_nav(s,active)
    return lambda: (s.end(), s.end())

vac=[
{"title":"Стажер-аналитик данных","description":"Работайте с исследовательскими командами над опросами, лабораторными и учебными данными.","department":"Офис исследовательских проектов","type":"Стажировка","location":"Офис исследовательских проектов","workload":"16 часов/неделю","salary":"600.00 - 850.00","deadline":"Не указано","responsibilities":"Очищать наборы данных, готовить дашборды и резюмировать выводы для руководителей проектов.","requirements":"Опыт Python или таблиц, внимательность и интерес к прикладным исследованиям."},
{"title":"Ассистент IT-поддержки","description":"Помогайте студентам и сотрудникам решать повседневные IT-задачи в кампусе.","department":"Кафедра компьютерных наук","type":"Стажировка","location":"IT-служба главного кампуса","workload":"20 часов/неделю","salary":"500.00 - 700.00","deadline":"05.05.2026"},
{"title":"Помощник библиотечной службы","description":"Поддерживайте команду библиотеки во время вечерних часов обслуживания студентов.","department":"Университетская библиотека","type":"Частичная занятость","location":"Университетская библиотека","workload":"12 часов/неделю","salary":"350.00 - 450.00","deadline":"Не указано"}
]

def vacancy_card(s,x,y,w,v,n):
    s.rect(x,y,w,230,C['card'],C['stroke'],14,n+' card')
    s.text(x+16,y+40,v['title'],24,C['text'],700,w-270,1.08,n+' title')
    s.text(x+16,y+73,v['description'],16,C['muted'],400,w-270,1.25,n+' desc')
    pill(s,x+w-218,y+18,110,'активна','green',n+' status'); button(s,x+w-96,y+14,82,36,'Открыть',True,n+' open')
    items=[('Подразделение',v['department']),('Работодатель','University Career Center'),('Тип занятости',v['type']),('Локация',v['location']),('Занятость',v['workload']),('Оплата',v['salary']),('Дедлайн подачи',v['deadline'])]
    item_w=(w-62)/4
    for i,(a,b) in enumerate(items): info(s,x+16+(i%4)*(item_w+10),y+88+(i//4)*74,item_w,a,b,n+f' info {i}')

# Desktop SVG
s=S()
s.text(0,34,'Current site UI / Desktop (RU)',30,C['text'],700,640,1,'desktop import title')
for idx,(nm,active,mode) in enumerate([('Desktop Home','Главная','public'),('Desktop Vacancies','Вакансии','public'),('Desktop Vacancy Details','Вакансии','student'),('Desktop Apply','Вакансии','student'),('Desktop Login','Главная','public'),('Desktop Register','Главная','public'),('Desktop Employer Profile','Профиль','employer'),('Desktop Student Applications','Мои заявки','student'),('Desktop Employer Admin','Панель','employer')]):
    col=idx%3; row=idx//3; x=col*1320; y=70+row*960
    end=desktop_frame(s,x,y,nm,active,mode)
    if nm=='Desktop Home':
        s.text(24,128,'Главная',46,C['text'],800,520,1.05,'title'); s.rect(24,154,820,210,C['hero'],C['stroke'],14,'hero')
        s.text(44,214,'Находите работу и стажировки в университете быстрее',32,C['text'],700,720,1.12,'hero title'); s.text(44,288,'Единая платформа для студентов, подразделений и партнёрских работодателей.',16,C['muted'],400,720,1.25,'hero subtitle')
        button(s,44,310,170,40,'Смотреть вакансии',True,'browse'); button(s,226,310,170,40,'Для работодателей',False,'for employer')
        s.rect(862,154,354,210,C['card'],C['stroke'],14,'stats'); s.text(882,204,'Быстрая статистика',24,C['text'],700,300,1,'stats title'); s.text(882,246,'7 активных вакансий',16,C['text'],400,280,1,'stat active'); s.text(882,280,'7 студенческих откликов',16,C['text'],400,280,1,'stat apps')
        s.rect(24,386,1192,292,C['card'],C['stroke'],14,'featured'); s.text(44,438,'Рекомендуемые предложения',24,C['text'],700,520,1,'featured title'); vacancy_card(s,44,462,1132,vac[0],'featured vacancy')
    elif nm=='Desktop Vacancies':
        s.text(24,128,'Список вакансий',46,C['text'],800,600,1.05,'title'); s.rect(24,154,650,40,C['card'],C['stroke'],10,'search'); s.text(38,179,'Поиск по ключевому слову, компании, роли...',16,C['muted'],400,500,1,'placeholder')
        s.rect(686,154,220,40,C['card'],C['stroke'],10,'dep select'); s.text(700,179,'Все подразделения',16,C['text'],400,160,1,'dep text'); s.rect(918,154,190,40,C['card'],C['stroke'],10,'type select'); s.text(932,179,'Все типы',16,C['text'],400,120,1,'type text'); button(s,1118,154,98,40,'Открыть',True,'open')
        vacancy_card(s,24,218,1192,vac[0],'vacancy 1'); vacancy_card(s,24,462,1192,vac[1],'vacancy 2')
    elif nm=='Desktop Vacancy Details':
        s.text(24,128,'Детали вакансии',46,C['text'],800,600,1.05,'title'); s.rect(24,154,1192,612,C['card'],C['stroke'],14,'card'); s.text(44,211,vac[0]['title'],32,C['text'],700,880,1.1,'vacancy title'); s.text(44,263,'Основная информация',24,C['text'],700,520,1,'main info')
        for i,(a,b) in enumerate([('Подразделение',vac[0]['department']),('Работодатель','University Career Center'),('Тип занятости',vac[0]['type']),('Локация',vac[0]['location']),('Занятость',vac[0]['workload']),('Оплата',vac[0]['salary']),('Дедлайн подачи',vac[0]['deadline']),('Статус','активна')]): info(s,44+(i%4)*280,280+(i//4)*74,264,a,b,'details info '+str(i))
        s.text(44,478,'Описание',24,C['text'],700,1060,1,'desc title'); s.text(44,514,vac[0]['description'],16,C['text'],400,1060,1.3,'desc')
        s.text(44,564,'Обязанности',24,C['text'],700,1060,1,'resp title'); s.text(44,600,vac[0]['responsibilities'],16,C['text'],400,1060,1.3,'resp')
        s.text(44,650,'Требования',24,C['text'],700,1060,1,'req title'); s.text(44,686,vac[0]['requirements'],16,C['text'],400,1060,1.3,'req'); button(s,44,704,150,40,'Откликнуться',True,'apply')
    elif nm=='Desktop Apply':
        s.text(24,128,'Форма отклика',46,C['text'],800,600,1.05,'title'); s.rect(24,154,1192,140,C['card'],C['stroke'],14,'context'); s.text(44,202,'Вакансия, на которую вы откликаетесь',24,C['text'],700,620,1,'context title'); s.text(44,240,vac[0]['title'],20,C['text'],700,620,1,'context vacancy'); s.text(44,272,f"{vac[0]['department']} • {vac[0]['type']} • {vac[0]['workload']}",16,C['muted'],400,900,1,'context meta')
        s.rect(24,314,1192,438,C['card'],C['stroke'],14,'form'); s.text(44,364,'Отправьте заявку',24,C['text'],700,620,1,'form title'); input_box(s,44,390,1120,40,'Резюме','Выберите файл или укажите ссылку','resume'); input_box(s,44,474,1120,120,'Сопроводительное письмо','Почему вы подходите на эту позицию?','letter'); input_box(s,44,626,1120,80,'Сообщение работодателю','Краткое сообщение','message'); button(s,44,724,170,40,'Отправить отклик',True,'submit'); button(s,226,724,96,40,'Отмена',False,'cancel')
    elif nm=='Desktop Login':
        s.text(24,128,'Вход',46,C['text'],800,600,1.05,'title'); s.rect(170,166,900,360,C['card'],C['stroke'],14,'login card'); s.text(194,220,'Войдите в аккаунт',24,C['text'],700,420,1,'login title'); s.text(194,250,'Войдите, чтобы откликаться на вакансии и отслеживать статусы заявок.',14,C['muted'],400,620,1.25,'login note'); input_box(s,194,282,852,40,'Логин или email','student@example.edu','login user'); input_box(s,194,366,852,40,'Пароль','Введите пароль','login pass'); button(s,194,462,120,40,'Войти',True,'submit'); button(s,326,462,150,40,'Создать аккаунт',False,'reg')
    elif nm=='Desktop Register':
        s.text(24,128,'Регистрация',46,C['text'],800,600,1.05,'title'); s.rect(120,152,1000,560,C['card'],C['stroke'],14,'register card'); s.text(144,204,'Создайте студенческий аккаунт',24,C['text'],700,620,1,'register title'); s.text(144,232,'После регистрации можно откликаться на вакансии и редактировать профиль.',14,C['muted'],400,760,1.2,'register note')
        for i,(lab,val) in enumerate([('Предпочитаемый язык','Русский'),('Логин','anna.kovalenko'),('Email','student@example.edu'),('Имя','Анна'),('Фамилия','Коваленко'),('Пароль','Минимум 8 символов'),('Подтвердите пароль','Повторите пароль')]): input_box(s,144+(i%2)*484,260+(i//2)*84,460 if i%2==0 else 468,40,lab,val,'reg '+str(i))
        button(s,144,620,170,40,'Создать аккаунт',True,'submit'); button(s,326,620,150,40,'Назад ко входу',False,'back')
    elif nm=='Desktop Employer Profile':
        s.text(24,128,'Профиль',46,C['text'],800,600,1.05,'title'); s.rect(24,154,386,310,C['card'],C['stroke'],14,'profile'); s.text(44,209,'Marta Reed',32,C['text'],700,320,1,'name'); s.text(44,245,'Email: career.center@example.edu\nРоль: Работодатель\nПредпочитаемый язык: Английский\nНазвание организации: University Career Center\nДолжность: Recruitment Coordinator\nПодразделение: Кафедра компьютерных наук',16,C['text'],400,320,1.55,'meta')
        s.rect(430,154,786,310,C['card'],C['stroke'],14,'actions'); s.text(454,211,'Быстрые действия',32,C['text'],700,420,1,'actions title'); button(s,454,238,170,40,'Смотреть вакансии',True,'view'); button(s,638,238,260,40,'Открыть панель работодателя',False,'admin')
        s.rect(24,488,1192,300,C['card'],C['stroke'],14,'edit'); s.text(44,535,'Редактировать профиль работодателя',24,C['text'],700,620,1,'edit title')
        for i,(lab,val) in enumerate([('Имя','Marta'),('Фамилия','Reed'),('Предпочитаемый язык','English'),('Название организации','University Career Center'),('Должность','Recruitment Coordinator'),('Подразделение','Кафедра компьютерных наук')]): input_box(s,44+(i%3)*384,558+(i//3)*84,360,40,lab,val,'profile input '+str(i))
        button(s,44,736,170,40,'Сохранить профиль',True,'save')
    elif nm=='Desktop Student Applications':
        s.text(24,128,'Кабинет студента / Мои заявки',46,C['text'],800,760,1.05,'title'); s.rect(24,154,360,520,C['card'],C['stroke'],14,'student'); s.text(44,205,'Anna Kovalenko',28,C['text'],700,300,1,'student name'); s.text(44,255,'Computer Science • 2 курс\nРезюме: Anna Kovalenko CV\nEmail: anna.kovalenko@example.edu',16,C['text'],400,300,1.55,'student meta'); button(s,44,598,190,40,'Редактировать профиль',False,'edit student')
        s.rect(408,154,808,520,C['card'],C['stroke'],14,'apps'); s.text(432,210,'Мои заявки',28,C['text'],700,420,1,'apps title')
        for i,v in enumerate(vac):
            yy=226+i*126; s.rect(432,yy,736,104,C['card'],C['stroke'],12,'app row '+str(i)); s.text(450,yy+38,v['title'],20,C['text'],700,420,1,'app title '+str(i)); s.text(450,yy+68,f"{v['department']} • {v['workload']}",14,C['muted'],400,480,1,'app meta '+str(i)); pill(s,978,yy+18,150,['на рассмотрении','интервью','отправлена'][i],['orange','violet','blue'][i],'app status '+str(i))
    else:
        s.text(24,128,'Управление вакансиями работодателя',46,C['text'],800,860,1.05,'title'); s.rect(24,154,380,330,C['card'],C['stroke'],14,'vacancies'); s.text(44,209,'Вакансии',28,C['text'],700,320,1,'vacancies title')
        for i,v in enumerate(vac):
            yy=226+i*76; s.line(44,yy-12,364,yy-12,C['stroke'],'divider '+str(i)); s.text(44,yy+18,v['title'],16,C['text'],700,220,1,'admin vacancy '+str(i)); pill(s,282,yy-2,82,'активна','green','status '+str(i)); button(s,44,yy+34,92,32,'Отклики',False,'resp '+str(i)); button(s,146,yy+34,82,32,'Редакт.',False,'edit '+str(i))
        s.rect(426,154,790,330,C['card'],C['stroke'],14,'responses'); s.text(450,209,'Отклики по вакансии',28,C['text'],700,420,1,'responses title')
        for i,(n,email,st) in enumerate([('Anna Kovalenko','anna.kovalenko@example.edu','отправлена'),('Igor Petrov','igor.petrov@example.edu','интервью'),('Lea Muller','lea.muller@example.edu','принята')]):
            yy=226+i*80; s.rect(450,yy,720,64,C['input'],C['stroke_soft'],12,'response '+str(i)); s.text(466,yy+32,n,18,C['text'],700,220,1,'response name '+str(i)); s.text(466,yy+54,email,13,C['muted'],400,260,1,'response email '+str(i)); pill(s,788,yy+18,120,st,'green' if i==2 else ('violet' if i==1 else 'blue'),'response status '+str(i)); button(s,1048,yy+16,92,34,'Детали',False,'details '+str(i))
        s.rect(24,506,1192,300,C['card'],C['stroke'],14,'create'); s.text(44,556,'Создать вакансию',28,C['text'],700,420,1,'create title'); input_box(s,44,580,360,40,'Подразделение','Введите любое название подразделения','dep'); input_box(s,428,580,220,40,'Тип','Стажировка','type'); input_box(s,672,580,220,40,'Статус','черновик','status'); input_box(s,916,580,256,40,'Занятость (часов/неделю)','16','workload'); s.rect(44,678,700,92,C['card'],C['stroke'],10,'ru group'); s.text(60,690,'RU (основная версия)',14,C['text'],600,200,1,'ru legend'); s.text(64,730,'Название (RU)   Описание (RU)   Обязанности (RU)   Требования (RU)   Локация (RU)',14,C['muted'],400,660,1,'ru fields'); button(s,770,684,210,40,'Добавить локализацию EN',False,'add en'); button(s,994,684,210,40,'Добавить локализацию DE',False,'add de'); button(s,770,734,180,40,'Создать вакансию',True,'submit')
    end()
(BASE/'figma_desktop_current_site.svg').write_text(build(3960,2950,'\n'.join(s.p)),encoding='utf-8')

# Mobile SVG
s=S(); s.text(0,34,'Current site UI / Mobile (RU)',30,C['text'],700,640,1,'mobile import title')
for idx,(name,active) in enumerate([('Mobile Home','Главная'),('Mobile Vacancies','Вакансии'),('Mobile Details','Вакансии'),('Mobile Admin','Панель')]):
    x=idx*440; y=70; end=mobile_frame(s,x,y,name,active); s.text(20,123, {'Mobile Home':'Главная','Mobile Vacancies':'Список вакансий','Mobile Details':'Детали вакансии','Mobile Admin':'Управление вакансиями'}[name],34,C['text'],700,340,1.05,'title')
    if name=='Mobile Home':
        s.text(20,158,'Рекомендуемые предложения',16,C['muted'],400,320,1,'subtitle'); s.rect(20,174,350,42,C['card'],C['stroke'],12,'search'); s.text(34,200,'Поиск по роли, подразделению или ключевому слову',14,C['muted'],400,312,1,'search text'); s.rect(20,234,350,154,C['hero'],C['stroke'],14,'featured'); s.text(34,271,'Рекомендуемая стажировка',14,'#55709d',600,280,1,'overline'); s.text(34,318,vac[0]['title'],24,C['text'],700,294,1.08,'vac title'); s.text(34,362,vac[0]['department'],16,C['text'],400,280,1,'dep'); pill(s,34,370,110,'активна','green','status'); s.rect(20,404,170,104,C['card'],C['stroke'],14,'stat1'); s.text(34,458,'7',34,C['blue'],700,120,1,'stat num'); s.text(34,486,'Активные вакансии',16,C['text'],400,130,1,'stat label'); s.rect(200,404,170,104,C['card'],C['stroke'],14,'stat2'); s.text(214,458,'7',34,'#0f7f6f',700,120,1,'app num'); s.text(214,486,'студенческих откликов',16,C['text'],400,130,1,'app label')
    elif name=='Mobile Vacancies':
        s.rect(20,140,350,42,C['card'],C['stroke'],12,'search'); s.text(34,166,'Поиск по ключевому слову...',16,C['muted'],400,300,1,'search text'); s.rect(20,194,350,42,C['card'],C['stroke'],12,'dep select'); s.text(34,220,'Все подразделения',16,C['text'],400,260,1,'dep text'); s.rect(20,248,350,42,C['card'],C['stroke'],12,'type select'); s.text(34,274,'Все типы',16,C['text'],400,260,1,'type text'); button(s,20,302,350,52,'Открыть',True,'open')
        for i,v in enumerate(vac[:2]):
            yy=374+i*174; s.rect(20,yy,350,158,C['card'],C['stroke'],14,'vac '+str(i)); s.text(34,yy+44,v['title'],22,C['text'],700,270,1.08,'title '+str(i)); s.text(34,yy+80,v['description'],15,C['muted'],400,286,1.2,'desc '+str(i)); pill(s,34,yy+112,110,'активна','green','status '+str(i)); button(s,256,yy+106,92,42,'Открыть',True,'btn '+str(i))
    elif name=='Mobile Details':
        s.rect(20,140,350,584,C['card'],C['stroke'],14,'details'); s.text(34,194,vac[0]['title'],28,C['text'],700,286,1.08,'vac title'); s.text(34,252,'Основная информация',24,C['text'],700,280,1,'main'); info(s,34,270,302,'Подразделение',vac[0]['department'],'info dep'); info(s,34,344,302,'Работодатель','University Career Center','info emp'); info(s,34,418,302,'Занятость',vac[0]['workload'],'info workload'); s.text(34,538,'Описание',24,C['text'],700,302,1,'desc title'); s.text(34,574,vac[0]['description'],16,C['text'],400,302,1.28,'desc'); button(s,34,664,160,52,'Откликнуться',True,'apply')
    else:
        s.rect(20,148,350,214,C['card'],C['stroke'],14,'vacancies'); s.text(34,194,'Вакансии',28,C['text'],700,260,1,'vacancies title')
        for i,v in enumerate(vac[:2]):
            yy=212+i*68; s.text(34,yy+18,v['title'],16,C['text'],700,220,1,'vac '+str(i)); pill(s,260,yy-2,88,'активна','green','status '+str(i)); button(s,34,yy+30,88,32,'Отклики',False,'resp '+str(i))
        s.rect(20,382,350,342,C['card'],C['stroke'],14,'form'); s.text(34,428,'Создать вакансию',28,C['text'],700,260,1,'create'); input_box(s,34,452,302,42,'Подразделение','Введите любое название','dep'); input_box(s,34,536,302,42,'Тип','Стажировка','type'); input_box(s,34,620,302,42,'Статус','черновик','status'); button(s,34,700,190,42,'Создать вакансию',True,'submit')
    end()
(BASE/'figma_mobile_current_site.svg').write_text(build(1760,980,'\n'.join(s.p)),encoding='utf-8')
print(BASE/'figma_desktop_current_site.svg')
print(BASE/'figma_mobile_current_site.svg')
