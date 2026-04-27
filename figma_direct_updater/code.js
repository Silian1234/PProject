const C = {
  bg: '#e9edf5', card: '#f8f9fb', hero: '#dfe7f7', stroke: '#cbd6ea', strokeSoft: '#dbe4f4',
  text: '#162c57', muted: '#64758f', blue: '#2a55d7', greenSoft: '#cae8d8', greenText: '#2d854d',
  greenStroke: '#57b77e', orange: '#d07a00', orangeSoft: '#ffe6c1', violet: '#7543f0', input: '#f3f6fb', white: '#ffffff'
};

const vacancies = [
  {
    title: 'Стажер-аналитик данных',
    description: 'Работайте с исследовательскими командами над опросами, лабораторными и учебными данными.',
    department: 'Офис исследовательских проектов', type: 'Стажировка', location: 'Офис исследовательских проектов',
    workload: '16 часов/неделю', salary: '600.00 - 850.00', deadline: 'Не указано',
    responsibilities: 'Очищать наборы данных, готовить дашборды и резюмировать выводы для руководителей проектов.',
    requirements: 'Опыт Python или таблиц, внимательность и интерес к прикладным исследованиям.'
  },
  {
    title: 'Ассистент IT-поддержки',
    description: 'Помогайте студентам и сотрудникам решать повседневные IT-задачи в кампусе.',
    department: 'Кафедра компьютерных наук', type: 'Стажировка', location: 'IT-служба главного кампуса',
    workload: '20 часов/неделю', salary: '500.00 - 700.00', deadline: '05.05.2026'
  },
  {
    title: 'Помощник библиотечной службы',
    description: 'Поддерживайте команду библиотеки во время вечерних часов обслуживания студентов.',
    department: 'Университетская библиотека', type: 'Частичная занятость', location: 'Университетская библиотека',
    workload: '12 часов/неделю', salary: '350.00 - 450.00', deadline: 'Не указано'
  }
];

function rgb(hex) {
  const value = parseInt(hex.replace('#', ''), 16);
  return { r: ((value >> 16) & 255) / 255, g: ((value >> 8) & 255) / 255, b: (value & 255) / 255 };
}
function solid(hex, opacity = 1) { return { type: 'SOLID', color: rgb(hex), opacity }; }
function isTransparent(value) { return value === 'transparent' || value === 'none' || value === null || value === undefined; }
function stroke(node, color = C.stroke, weight = 1) {
  if (isTransparent(color)) { node.strokes = []; return; }
  node.strokes = [solid(color)];
  node.strokeWeight = weight;
  node.strokeAlign = 'INSIDE';
}
function clear(frame) { for (const child of [...frame.children]) child.remove(); }
function paintFrame(frame, fill = C.bg) { frame.fills = [solid(fill)]; frame.clipsContent = true; }

const font = {
  regular: { family: 'Inter', style: 'Regular' },
  semi: { family: 'Inter', style: 'Semi Bold' },
  bold: { family: 'Inter', style: 'Bold' }
};
async function loadFonts() {
  const available = await figma.listAvailableFontsAsync();
  const has = (family, style) => available.some((f) => f.fontName.family === family && f.fontName.style === style);
  if (!has('Inter', 'Regular')) {
    const fallback = available.find((f) => f.fontName.style === 'Regular') || available[0];
    font.regular = fallback.fontName;
    font.semi = fallback.fontName;
    font.bold = fallback.fontName;
  }
  await figma.loadFontAsync(font.regular);
  await figma.loadFontAsync(font.semi);
  await figma.loadFontAsync(font.bold);
}
function rect(parent, name, x, y, w, h, fill = C.card, border = C.stroke, radius = 14) {
  const node = figma.createRectangle();
  parent.appendChild(node);
  node.name = name;
  node.x = x; node.y = y; node.resize(w, h);
  node.fills = isTransparent(fill) ? [] : [solid(fill)];
  if (border) stroke(node, border); else node.strokes = [];
  node.cornerRadius = radius;
  return node;
}
function text(parent, name, value, x, y, w, size = 16, color = C.text, weight = 'regular', line = 1.25) {
  const node = figma.createText();
  parent.appendChild(node);
  node.name = name;
  node.x = x; node.y = y; node.resize(w, Math.max(24, size + 8));
  node.fontName = font[weight] || font.regular;
  node.fontSize = size;
  node.lineHeight = { unit: 'PIXELS', value: Math.round(size * line) };
  node.fills = [solid(color)];
  node.characters = value;
  node.textDecoration = 'NONE';
  node.textAutoResize = 'HEIGHT';
  return node;
}
function button(parent, label, x, y, w = 150, h = 40, primary = true) {
  rect(parent, `Button / ${label}`, x, y, w, h, primary ? C.blue : 'transparent', C.blue, 10);
  const size = h < 40 ? 12 : 14;
  const labelNode = text(parent, `Button text / ${label}`, label, x, y + Math.round((h - size) / 2) - 1, w, size, primary ? C.white : C.blue, 'semi', 1.05);
  labelNode.textAlignHorizontal = 'CENTER';
}
function pill(parent, label, x, y, w = 110, kind = 'green') {
  const variants = {
    green: [C.greenSoft, C.greenStroke, C.greenText],
    orange: [C.orangeSoft, '#f0ab54', C.orange],
    violet: ['#efe8ff', '#9e7ef4', C.violet],
    blue: ['#d6e0f7', '#d6e0f7', C.blue]
  };
  const [fill, border, color] = variants[kind] || variants.blue;
  rect(parent, `Pill / ${label}`, x, y, w, 28, fill, border, 999);
  const labelNode = text(parent, `Pill text / ${label}`, label, x, y + 6, w, 12, color, 'semi', 1.05);
  labelNode.textAlignHorizontal = 'CENTER';
}
function info(parent, label, value, x, y, w, h = 62) {
  rect(parent, `Info / ${label}`, x, y, w, h, C.input, C.strokeSoft, 10);
  text(parent, `Info label / ${label}`, label, x + 10, y + 8, w - 20, 11, C.muted, 'regular', 1.1);
  text(parent, `Info value / ${label}`, value, x + 10, y + 29, w - 20, 12, C.text, 'bold', 1.1);
}
function input(parent, label, x, y, w, h = 40, placeholder = '') {
  text(parent, `Label / ${label}`, label, x, y, w, 12, C.text, 'regular', 1.1);
  rect(parent, `Input / ${label}`, x, y + 20, w, h, C.card, C.stroke, 10);
  if (placeholder) text(parent, `Placeholder / ${label}`, placeholder, x + 12, y + 31, w - 24, 12, C.muted, 'regular', 1.1);
}
function topbar(frame, active, mode = 'public') {
  const w = frame.width;
  rect(frame, 'Topbar', 12, 12, w - 24, 46, C.card, C.stroke, 12);
  text(frame, 'Logo', 'PProject', 26, 24, 120, 20, C.text, 'bold', 1);
  const links = mode === 'student' ? ['Главная', 'Вакансии', 'Мои заявки', 'Профиль'] : mode === 'employer' ? ['Главная', 'Вакансии', 'Панель', 'Профиль'] : ['Главная', 'Вакансии'];
  let x = 160;
  for (const link of links) {
    text(frame, `Nav / ${link}`, link, x, 29, 94, 12, link === active ? C.blue : C.text, link === active ? 'semi' : 'regular', 1);
    x += link.length > 8 ? 94 : 78;
  }
  let rx = w - (mode === 'public' ? 360 : 150);
  for (const lang of ['RU', 'EN', 'DE']) {
    rect(frame, `Lang / ${lang}`, rx, 22, 42, 24, lang === 'RU' ? '#d6e0f7' : C.card, C.stroke, 7);
    text(frame, `Lang text / ${lang}`, lang, rx + 11, 29, 24, 10, lang === 'RU' ? C.blue : C.muted, lang === 'RU' ? 'semi' : 'regular', 1);
    rx += 48;
  }
  if (mode === 'public') {
    button(frame, 'Вход', w - 174, 21, 58, 26, false);
    button(frame, 'Регистрация', w - 110, 21, 96, 26, false);
  } else {
    button(frame, 'Выход', w - 70, 21, 58, 26, false);
  }
}
function footer(frame) {
  const y = frame.height - 46;
  rect(frame, 'Footer', 12, y, frame.width - 24, 34, C.card, C.stroke, 10);
  text(frame, 'Footer brand', 'PProject', 24, y + 10, 90, 11, C.text, 'bold', 1);
  text(frame, 'Footer text', 'Работа и стажировки для студентов', 126, y + 10, 260, 11, C.muted, 'regular', 1);
  text(frame, 'Footer contact', 'example@gmail.com', frame.width - 160, y + 10, 140, 11, C.blue, 'semi', 1);
}
function desktopBase(frame, active, mode) { clear(frame); paintFrame(frame); topbar(frame, active, mode); footer(frame); }
function mobileBase(frame, active) {
  clear(frame); paintFrame(frame);
  rect(frame, 'Mobile topbar', 10, 10, frame.width - 20, 58, C.card, C.stroke, 14);
  text(frame, 'Logo', 'PProject', 22, 21, 150, 26, C.text, 'bold', 1);
  let x = frame.width - 164;
  for (const lang of ['RU', 'EN', 'DE']) {
    rect(frame, `Lang / ${lang}`, x, 24, 44, 30, lang === 'RU' ? '#d6e0f7' : C.card, C.stroke, 999);
    text(frame, `Lang text / ${lang}`, lang, x + 10, 31, 28, 13, lang === 'RU' ? C.blue : C.muted, 'semi', 1);
    x += 48;
  }
  rect(frame, 'Mobile nav', 10, frame.height - 66, frame.width - 20, 56, C.card, C.stroke, 16);
  const tabs = ['Главная', 'Вакансии', 'Панель', 'Профиль'];
  tabs.forEach((tab, i) => text(frame, `Tab / ${tab}`, tab, 26 + i * ((frame.width - 52) / 4), frame.height - 44, 74, 11, tab === active ? C.blue : '#7385a2', 'semi', 1));
}
function vacancyCard(parent, v, x, y, w) {
  rect(parent, `Vacancy / ${v.title}`, x, y, w, 120, C.card, C.stroke, 12);
  text(parent, `Vacancy title / ${v.title}`, v.title, x + 14, y + 14, w - 170, 18, C.text, 'bold', 1.1);
  text(parent, `Vacancy desc / ${v.title}`, v.description, x + 14, y + 42, w - 170, 12, C.muted, 'regular', 1.2);
  pill(parent, 'активна', x + w - 150, y + 18, 78, 'green');
  button(parent, 'Открыть', x + w - 66, y + 14, 54, 30, true);
}
function updateDesktopHome(frame) {
  desktopBase(frame, 'Главная', 'public');
  text(frame, 'Title', 'Главная', 20, 76, 420, 34, C.text, 'bold', 1.05);
  const leftW = Math.round((frame.width - 60) * 0.68);
  rect(frame, 'Hero', 20, 138, leftW, 170, C.hero, C.stroke, 12);
  text(frame, 'Hero title', 'Находите работу и стажировки в университете быстрее', 42, 162, leftW - 48, 28, C.text, 'bold', 1.12);
  text(frame, 'Hero subtitle', 'Единая платформа для студентов, подразделений и партнёрских работодателей.', 42, 232, leftW - 48, 13, C.muted, 'regular', 1.25);
  button(frame, 'Смотреть вакансии', 42, 268, 138, 34, true);
  button(frame, 'Для работодателей', 192, 268, 142, 34, false);
  rect(frame, 'Stats', 34 + leftW, 138, frame.width - leftW - 54, 170, C.card, C.stroke, 12);
  text(frame, 'Stats title', 'Быстрая статистика', 54 + leftW, 162, 210, 20, C.text, 'bold', 1);
  text(frame, 'Stats active', '7 активных вакансий', 54 + leftW, 204, 210, 13, C.text, 'regular', 1);
  text(frame, 'Stats apps', '7 студенческих откликов', 54 + leftW, 232, 210, 13, C.text, 'regular', 1);
  rect(frame, 'Featured', 20, 330, frame.width - 40, 145, C.card, C.stroke, 12);
  text(frame, 'Featured title', 'Рекомендуемые предложения', 42, 354, 300, 18, C.text, 'bold', 1);
  vacancyCard(frame, vacancies[0], 42, 386, frame.width - 84);
}
function updateDesktopVacancies(frame) {
  desktopBase(frame, 'Вакансии', 'public');
  text(frame, 'Title', 'Список вакансий', 20, 76, 440, 34, C.text, 'bold', 1.05);
  rect(frame, 'Search', 20, 138, frame.width * 0.55, 36, C.card, C.stroke, 10);
  text(frame, 'Search placeholder', 'Поиск по ключевому слову, компании, роли...', 34, 149, frame.width * 0.48, 12, C.muted, 'regular', 1);
  rect(frame, 'Department filter', 34 + frame.width * 0.55, 138, 150, 36, C.card, C.stroke, 10);
  text(frame, 'Department text', 'Все подразделения', 48 + frame.width * 0.55, 149, 120, 12, C.text, 'regular', 1);
  rect(frame, 'Type filter', 194 + frame.width * 0.55, 138, 120, 36, C.card, C.stroke, 10);
  text(frame, 'Type text', 'Все типы', 208 + frame.width * 0.55, 149, 80, 12, C.text, 'regular', 1);
  button(frame, 'Открыть', frame.width - 110, 138, 90, 36, true);
  vacancyCard(frame, vacancies[0], 20, 200, frame.width - 40);
  vacancyCard(frame, vacancies[1], 20, 334, frame.width - 40);
  vacancyCard(frame, vacancies[2], 20, 468, frame.width - 40);
}
function updateDesktopDetails(frame) {
  desktopBase(frame, 'Вакансии', 'student');
  text(frame, 'Title', 'Детали вакансии', 20, 76, 440, 34, C.text, 'bold', 1.05);
  rect(frame, 'Details card', 20, 138, frame.width - 40, frame.height - 210, C.card, C.stroke, 12);
  text(frame, 'Vacancy title', vacancies[0].title, 42, 164, frame.width - 84, 24, C.text, 'bold', 1.1);
  text(frame, 'Main info', 'Основная информация', 42, 214, 320, 18, C.text, 'bold', 1);
  const cols = 4; const iw = (frame.width - 104) / cols;
  const items = [['Подразделение', vacancies[0].department], ['Работодатель', 'University Career Center'], ['Тип занятости', vacancies[0].type], ['Локация', vacancies[0].location], ['Занятость', vacancies[0].workload], ['Оплата', vacancies[0].salary], ['Дедлайн подачи', vacancies[0].deadline], ['Статус', 'активна']];
  items.forEach((it, i) => info(frame, it[0], it[1], 42 + (i % cols) * iw, 246 + Math.floor(i / cols) * 72, iw - 10));
  text(frame, 'Desc title', 'Описание', 42, 410, 320, 18, C.text, 'bold', 1);
  text(frame, 'Desc body', vacancies[0].description, 42, 440, frame.width - 84, 13, C.text, 'regular', 1.25);
  text(frame, 'Resp title', 'Обязанности', 42, 500, 320, 18, C.text, 'bold', 1);
  text(frame, 'Resp body', vacancies[0].responsibilities, 42, 530, frame.width - 84, 13, C.text, 'regular', 1.25);
  text(frame, 'Req title', 'Требования', 42, 590, 320, 18, C.text, 'bold', 1);
  text(frame, 'Req body', vacancies[0].requirements, 42, 620, frame.width - 84, 13, C.text, 'regular', 1.25);
  button(frame, 'Откликнуться', 42, frame.height - 112, 130, 36, true);
}
function updateDesktopApply(frame) {
  desktopBase(frame, 'Вакансии', 'student');
  text(frame, 'Title', 'Форма отклика', 20, 76, 440, 34, C.text, 'bold', 1.05);
  rect(frame, 'Context', 20, 138, frame.width - 40, 104, C.card, C.stroke, 12);
  text(frame, 'Context title', 'Вакансия, на которую вы откликаетесь', 42, 162, 420, 18, C.text, 'bold', 1);
  text(frame, 'Context vacancy', vacancies[0].title, 42, 192, 460, 15, C.text, 'bold', 1);
  text(frame, 'Context meta', `${vacancies[0].department} • ${vacancies[0].type} • ${vacancies[0].workload}`, 42, 218, 600, 12, C.muted, 'regular', 1);
  rect(frame, 'Form card', 20, 262, frame.width - 40, frame.height - 340, C.card, C.stroke, 12);
  text(frame, 'Form title', 'Отправьте заявку', 42, 286, 420, 18, C.text, 'bold', 1);
  input(frame, 'Резюме', 42, 332, frame.width - 84, 36, 'Выберите файл или укажите ссылку');
  input(frame, 'Сопроводительное письмо', 42, 410, frame.width - 84, 100, 'Почему вы подходите на эту позицию?');
  input(frame, 'Сообщение работодателю', 42, 548, frame.width - 84, 72, 'Краткое сообщение');
  button(frame, 'Отправить отклик', 42, frame.height - 112, 146, 36, true);
  button(frame, 'Отмена', 200, frame.height - 112, 90, 36, false);
}
function updateDesktopStudent(frame) {
  desktopBase(frame, 'Мои заявки', 'student');
  text(frame, 'Title', 'Кабинет студента / Мои заявки', 20, 76, 620, 34, C.text, 'bold', 1.05);
  rect(frame, 'Student card', 20, 138, 260, frame.height - 220, C.card, C.stroke, 12);
  text(frame, 'Student name', 'Anna Kovalenko', 42, 170, 210, 22, C.text, 'bold', 1);
  text(frame, 'Student meta', 'Computer Science • 2 курс\nРезюме: Anna Kovalenko CV\nEmail: anna.kovalenko@example.edu', 42, 216, 210, 12, C.text, 'regular', 1.4);
  button(frame, 'Редактировать профиль', 42, frame.height - 112, 170, 34, false);
  rect(frame, 'Applications', 300, 138, frame.width - 320, frame.height - 220, C.card, C.stroke, 12);
  text(frame, 'Applications title', 'Мои заявки', 322, 170, 320, 22, C.text, 'bold', 1);
  vacancies.forEach((v, i) => {
    const y = 220 + i * 104;
    rect(frame, `Application / ${v.title}`, 322, y, frame.width - 366, 84, C.card, C.stroke, 12);
    text(frame, `Application title / ${v.title}`, v.title, 340, y + 18, 320, 16, C.text, 'bold', 1);
    text(frame, `Application meta / ${v.title}`, `${v.department} • ${v.workload}`, 340, y + 45, 380, 11, C.muted, 'regular', 1);
    pill(frame, ['на рассмотрении', 'интервью', 'отправлена'][i], frame.width - 190, y + 20, 142, ['orange', 'violet', 'blue'][i]);
  });
}
function updateDesktopAdmin(frame) {
  desktopBase(frame, 'Панель', 'employer');
  text(frame, 'Title', 'Управление вакансиями работодателя', 20, 76, 700, 34, C.text, 'bold', 1.05);
  rect(frame, 'Vacancies', 20, 138, 320, 280, C.card, C.stroke, 12);
  text(frame, 'Vacancies title', 'Вакансии', 42, 168, 220, 20, C.text, 'bold', 1);
  vacancies.forEach((v, i) => {
    const y = 214 + i * 64;
    text(frame, `Admin vacancy / ${v.title}`, v.title, 42, y, 190, 12, C.text, 'bold', 1);
    pill(frame, 'активна', 234, y - 16, 78, 'green');
    button(frame, 'Отклики', 42, y + 16, 74, 26, false);
    button(frame, 'Редакт.', 124, y + 16, 72, 26, false);
  });
  rect(frame, 'Responses', 360, 138, frame.width - 380, 280, C.card, C.stroke, 12);
  text(frame, 'Responses title', 'Отклики по вакансии', 382, 168, 300, 20, C.text, 'bold', 1);
  [['Anna Kovalenko', 'anna.kovalenko@example.edu', 'отправлена'], ['Igor Petrov', 'igor.petrov@example.edu', 'интервью'], ['Lea Muller', 'lea.muller@example.edu', 'принята']].forEach((r, i) => {
    const y = 210 + i * 62;
    rect(frame, `Response / ${r[0]}`, 382, y, frame.width - 426, 50, C.input, C.strokeSoft, 10);
    text(frame, `Response name / ${r[0]}`, r[0], 396, y + 10, 180, 13, C.text, 'bold', 1);
    text(frame, `Response mail / ${r[0]}`, r[1], 396, y + 31, 220, 10, C.muted, 'regular', 1);
    pill(frame, r[2], frame.width - 240, y + 12, 105, i === 2 ? 'green' : i === 1 ? 'violet' : 'blue');
    button(frame, 'Детали', frame.width - 110, y + 10, 70, 30, false);
  });
  rect(frame, 'Create vacancy', 20, 440, frame.width - 40, frame.height - 520, C.card, C.stroke, 12);
  text(frame, 'Create title', 'Создать вакансию', 42, 470, 300, 20, C.text, 'bold', 1);
  input(frame, 'Подразделение', 42, 510, 280, 36, 'Введите любое название подразделения');
  input(frame, 'Тип', 340, 510, 180, 36, 'Стажировка');
  input(frame, 'Статус', 538, 510, 180, 36, 'черновик');
  input(frame, 'Занятость (часов/неделю)', 736, 510, 210, 36, '16');
  rect(frame, 'RU localization', 42, 600, frame.width * 0.55, 76, C.card, C.stroke, 10);
  text(frame, 'RU title', 'RU (основная версия)', 58, 612, 180, 12, C.text, 'semi', 1);
  text(frame, 'RU fields', 'Название (RU)   Описание (RU)   Обязанности (RU)   Требования (RU)   Локация (RU)', 58, 644, frame.width * 0.52, 11, C.muted, 'regular', 1);
  button(frame, 'Добавить локализацию EN', frame.width - 410, 610, 180, 34, false);
  button(frame, 'Добавить локализацию DE', frame.width - 210, 610, 180, 34, false);
  button(frame, 'Создать вакансию', frame.width - 410, 656, 160, 34, true);
}
function updateMobileHome(frame) {
  mobileBase(frame, 'Главная');
  text(frame, 'Title', 'Главная', 20, 86, 320, 28, C.text, 'bold', 1.1);
  text(frame, 'Subtitle', 'Рекомендуемые предложения', 20, 128, 320, 13, C.muted, 'regular', 1);
  rect(frame, 'Search', 20, 158, frame.width - 40, 42, C.card, C.stroke, 12);
  text(frame, 'Search text', 'Поиск по роли, подразделению или ключевому слову', 34, 171, frame.width - 68, 11, C.muted, 'regular', 1.1);
  rect(frame, 'Featured', 20, 220, frame.width - 40, 154, C.hero, C.stroke, 14);
  text(frame, 'Featured label', 'Рекомендуемая стажировка', 34, 242, 260, 12, '#55709d', 'semi', 1);
  text(frame, 'Featured title', vacancies[0].title, 34, 278, frame.width - 88, 18, C.text, 'bold', 1.1);
  text(frame, 'Featured dep', vacancies[0].department, 34, 324, frame.width - 88, 12, C.text, 'regular', 1);
  pill(frame, 'активна', 34, 342, 96, 'green');
  rect(frame, 'Stats active', 20, 394, (frame.width - 50) / 2, 94, C.card, C.stroke, 14);
  text(frame, 'Stats active number', '7', 34, 416, 80, 28, C.blue, 'bold', 1);
  text(frame, 'Stats active label', 'Активные вакансии', 34, 452, 110, 12, C.text, 'regular', 1.1);
  rect(frame, 'Stats apps', 30 + (frame.width - 50) / 2, 394, (frame.width - 50) / 2, 94, C.card, C.stroke, 14);
  text(frame, 'Stats apps number', '7', 44 + (frame.width - 50) / 2, 416, 80, 28, '#0f7f6f', 'bold', 1);
  text(frame, 'Stats apps label', 'студенческих откликов', 44 + (frame.width - 50) / 2, 452, 110, 12, C.text, 'regular', 1.1);
}
function updateMobileVacancies(frame) {
  mobileBase(frame, 'Вакансии');
  text(frame, 'Title', 'Список вакансий', 20, 86, 320, 28, C.text, 'bold', 1.1);
  rect(frame, 'Search', 20, 138, frame.width - 40, 42, C.card, C.stroke, 12);
  text(frame, 'Search text', 'Поиск по ключевому слову...', 34, 151, frame.width - 68, 12, C.muted, 'regular', 1.1);
  rect(frame, 'Department', 20, 192, frame.width - 40, 42, C.card, C.stroke, 12);
  text(frame, 'Department text', 'Все подразделения', 34, 205, 240, 12, C.text, 'regular', 1);
  rect(frame, 'Type', 20, 246, frame.width - 40, 42, C.card, C.stroke, 12);
  text(frame, 'Type text', 'Все типы', 34, 259, 240, 12, C.text, 'regular', 1);
  button(frame, 'Открыть', 20, 300, frame.width - 40, 46, true);
  vacancies.slice(0, 2).forEach((v, i) => {
    const y = 370 + i * 166;
    rect(frame, `Vacancy / ${v.title}`, 20, y, frame.width - 40, 150, C.card, C.stroke, 14);
    text(frame, `Title / ${v.title}`, v.title, 34, y + 20, frame.width - 92, 18, C.text, 'bold', 1.1);
    text(frame, `Desc / ${v.title}`, v.description, 34, y + 56, frame.width - 92, 12, C.muted, 'regular', 1.2);
    pill(frame, 'активна', 34, y + 104, 96, 'green');
    button(frame, 'Открыть', frame.width - 112, y + 100, 82, 38, true);
  });
}
function updateMobileDetails(frame) {
  mobileBase(frame, 'Вакансии');
  text(frame, 'Title', 'Детали вакансии', 20, 86, 320, 28, C.text, 'bold', 1.1);
  rect(frame, 'Card', 20, 138, frame.width - 40, frame.height - 230, C.card, C.stroke, 14);
  text(frame, 'Vacancy title', vacancies[0].title, 34, 164, frame.width - 88, 22, C.text, 'bold', 1.1);
  text(frame, 'Main info', 'Основная информация', 34, 226, frame.width - 88, 18, C.text, 'bold', 1);
  info(frame, 'Подразделение', vacancies[0].department, 34, 260, frame.width - 88);
  info(frame, 'Работодатель', 'University Career Center', 34, 330, frame.width - 88);
  info(frame, 'Занятость', vacancies[0].workload, 34, 400, frame.width - 88);
  text(frame, 'Desc title', 'Описание', 34, 492, frame.width - 88, 18, C.text, 'bold', 1);
  text(frame, 'Desc body', vacancies[0].description, 34, 522, frame.width - 88, 13, C.text, 'regular', 1.25);
  button(frame, 'Откликнуться', 34, frame.height - 138, 140, 46, true);
}
function updateMobileApply(frame) {
  mobileBase(frame, 'Вакансии');
  text(frame, 'Title', 'Форма отклика', 20, 86, 320, 28, C.text, 'bold', 1.1);
  rect(frame, 'Context', 20, 138, frame.width - 40, 110, C.card, C.stroke, 14);
  text(frame, 'Context title', vacancies[0].title, 34, 164, frame.width - 88, 18, C.text, 'bold', 1.1);
  text(frame, 'Context meta', `${vacancies[0].department}\n${vacancies[0].type} • ${vacancies[0].workload}`, 34, 196, frame.width - 88, 12, C.muted, 'regular', 1.2);
  input(frame, 'Резюме', 20, 276, frame.width - 40, 42, 'Выберите файл');
  input(frame, 'Сопроводительное письмо', 20, 360, frame.width - 40, 130, 'Почему вы подходите на эту позицию?');
  input(frame, 'Сообщение работодателю', 20, 532, frame.width - 40, 90, 'Краткое сообщение');
  button(frame, 'Отправить отклик', 20, frame.height - 128, frame.width - 40, 48, true);
}
function updateMobileApps(frame) {
  mobileBase(frame, 'Профиль');
  text(frame, 'Title', 'Мои заявки', 20, 86, 320, 28, C.text, 'bold', 1.1);
  text(frame, 'Subtitle', 'Статусы всех откликов в одном месте', 20, 124, 320, 12, C.muted, 'regular', 1);
  vacancies.forEach((v, i) => {
    const y = 160 + i * 112;
    rect(frame, `Application / ${v.title}`, 20, y, frame.width - 40, 92, C.card, C.stroke, 14);
    text(frame, `Application title / ${v.title}`, v.title, 34, y + 22, frame.width - 88, 16, C.text, 'bold', 1.1);
    text(frame, `Application meta / ${v.title}`, v.department, 34, y + 50, frame.width - 88, 11, C.muted, 'regular', 1);
    pill(frame, ['на рассмотрении', 'интервью', 'отправлена'][i], 34, y + 66, 132, ['orange', 'violet', 'blue'][i]);
  });
}
function updateMobileEmployer(frame) {
  mobileBase(frame, 'Панель');
  text(frame, 'Title', 'Управление вакансиями', 20, 86, 320, 28, C.text, 'bold', 1.1);
  rect(frame, 'Vacancies', 20, 142, frame.width - 40, 210, C.card, C.stroke, 14);
  text(frame, 'Vacancies title', 'Вакансии', 34, 170, 250, 20, C.text, 'bold', 1);
  vacancies.slice(0, 2).forEach((v, i) => {
    const y = 214 + i * 66;
    text(frame, `Vacancy / ${v.title}`, v.title, 34, y, 210, 13, C.text, 'bold', 1);
    pill(frame, 'активна', frame.width - 118, y - 16, 84, 'green');
    button(frame, 'Отклики', 34, y + 18, 84, 30, false);
  });
  rect(frame, 'Create card', 20, 380, frame.width - 40, 320, C.card, C.stroke, 14);
  text(frame, 'Create title', 'Создать вакансию', 34, 410, 250, 20, C.text, 'bold', 1);
  input(frame, 'Подразделение', 34, 452, frame.width - 68, 38, 'Введите любое название');
  input(frame, 'Тип', 34, 532, frame.width - 68, 38, 'Стажировка');
  input(frame, 'Статус', 34, 612, frame.width - 68, 38, 'черновик');
  button(frame, 'Создать вакансию', 34, 674, 160, 38, true);
}
function textareaBox(parent, label, x, y, w, h, placeholder = '') {
  text(parent, `Label / ${label}`, label, x, y, w, 12, C.text, 'regular', 1.1);
  rect(parent, `Textarea / ${label}`, x, y + 20, w, h, C.card, C.stroke, 10);
  if (placeholder) text(parent, `Textarea placeholder / ${label}`, placeholder, x + 12, y + 32, w - 24, 12, C.muted, 'regular', 1.15);
}
function selectField(parent, label, value, x, y, w, h = 40) {
  text(parent, `Label / ${label}`, label, x, y, w, 12, C.text, 'regular', 1.1);
  rect(parent, `Select / ${label}`, x, y + 20, w, h, C.card, C.stroke, 10);
  text(parent, `Select value / ${label}`, value, x + 12, y + 31, w - 36, 12, C.text, 'regular', 1.1);
  text(parent, `Select arrow / ${label}`, '⌄', x + w - 24, y + 29, 16, 14, C.muted, 'semi', 1);
}
function updateDesktopLogin(frame) {
  desktopBase(frame, 'Вход', 'public');
  text(frame, 'Title', 'Вход в систему', 42, 94, 420, 34, C.text, 'bold', 1.05);
  rect(frame, 'Auth card', 42, 150, 520, 310, C.card, C.stroke, 16);
  text(frame, 'Subtitle', 'Введите логин или email, чтобы продолжить работу с вакансиями и откликами.', 70, 182, 450, 14, C.muted, 'regular', 1.25);
  input(frame, 'Логин или email', 70, 238, 430, 42, 'student@example.com');
  input(frame, 'Пароль', 70, 320, 430, 42, '••••••••');
  button(frame, 'Войти', 70, 404, 120, 42, true);
  button(frame, 'Создать аккаунт', 204, 404, 170, 42, false);
  rect(frame, 'Help card', 600, 150, frame.width - 642, 310, C.hero, C.stroke, 16);
  text(frame, 'Help title', 'Доступ для студентов', 628, 184, 320, 22, C.text, 'bold', 1.1);
  text(frame, 'Help body', 'После регистрации студент может откликаться на вакансии, загружать резюме и отслеживать статусы заявок.', 628, 226, 320, 14, C.text, 'regular', 1.3);
  pill(frame, 'student', 628, 318, 92, 'blue');
  pill(frame, 'employer', 734, 318, 110, 'green');
}
function updateDesktopRegister(frame) {
  desktopBase(frame, 'Регистрация', 'public');
  text(frame, 'Title', 'Регистрация студента', 42, 88, 460, 34, C.text, 'bold', 1.05);
  rect(frame, 'Register card', 42, 142, frame.width - 84, 380, C.card, C.stroke, 16);
  text(frame, 'Hint', 'Регистрация создаёт обычный студенческий аккаунт. Работодатели создаются администратором.', 70, 174, 740, 14, C.muted, 'regular', 1.2);
  selectField(frame, 'Предпочитаемый язык', 'Русский', 70, 222, 250);
  input(frame, 'Username', 340, 222, 250, 40, 'alex.miller');
  input(frame, 'Email', 610, 222, 250, 40, 'alex@example.com');
  input(frame, 'Имя', 70, 306, 250, 40, 'Alex');
  input(frame, 'Фамилия', 340, 306, 250, 40, 'Miller');
  input(frame, 'Пароль', 610, 306, 250, 40, 'минимум 8 символов');
  input(frame, 'Повтор пароля', 70, 390, 250, 40, 'повторите пароль');
  button(frame, 'Создать аккаунт', 340, 434, 180, 42, true);
  button(frame, 'Назад ко входу', 536, 434, 160, 42, false);
}
function updateDesktopStudentProfile(frame) {
  desktopBase(frame, 'Профиль', 'student');
  text(frame, 'Title', 'Кабинет студента', 42, 82, 500, 34, C.text, 'bold', 1.05);
  rect(frame, 'Profile summary', 42, 138, 300, 260, C.card, C.stroke, 16);
  text(frame, 'Name', 'Alex Miller', 70, 168, 240, 22, C.text, 'bold', 1.1);
  text(frame, 'Meta', 'Email: alex@example.com\nРоль: студент\nЯзык: Русский\nПрограмма: Computer Science\nКурс: 3\nРезюме: alex_cv.pdf', 70, 214, 240, 13, C.text, 'regular', 1.4);
  rect(frame, 'Edit profile', 370, 138, frame.width - 412, 390, C.card, C.stroke, 16);
  text(frame, 'Edit title', 'Редактировать профиль', 398, 168, 360, 22, C.text, 'bold', 1.1);
  input(frame, 'Имя', 398, 218, 230, 40, 'Alex');
  input(frame, 'Фамилия', 650, 218, 230, 40, 'Miller');
  selectField(frame, 'Предпочитаемый язык', 'Русский', 398, 302, 230);
  input(frame, 'Программа', 650, 302, 230, 40, 'Computer Science');
  input(frame, 'Курс', 398, 386, 230, 40, '3');
  input(frame, 'Название резюме', 650, 386, 230, 40, 'alex_cv.pdf');
  input(frame, 'Файл резюме', 398, 470, 482, 40, 'Выберите файл');
  button(frame, 'Сохранить профиль', 398, 520, 180, 42, true);
}
function updateDesktopEmployerProfile(frame) {
  desktopBase(frame, 'Профиль', 'employer');
  text(frame, 'Title', 'Профиль работодателя', 42, 82, 520, 34, C.text, 'bold', 1.05);
  rect(frame, 'Employer summary', 42, 138, 300, 250, C.card, C.stroke, 16);
  text(frame, 'Name', 'Maria Novak', 70, 168, 240, 22, C.text, 'bold', 1.1);
  text(frame, 'Meta', 'Email: employer@example.com\nРоль: работодатель\nОрганизация: University Career Center\nДолжность: HR coordinator\nПодразделение: Центр карьеры', 70, 214, 240, 13, C.text, 'regular', 1.4);
  rect(frame, 'Edit employer', 370, 138, frame.width - 412, 350, C.card, C.stroke, 16);
  text(frame, 'Edit title', 'Редактировать данные работодателя', 398, 168, 440, 22, C.text, 'bold', 1.1);
  input(frame, 'Имя', 398, 218, 230, 40, 'Maria');
  input(frame, 'Фамилия', 650, 218, 230, 40, 'Novak');
  selectField(frame, 'Предпочитаемый язык', 'Русский', 398, 302, 230);
  input(frame, 'Организация', 650, 302, 230, 40, 'University Career Center');
  input(frame, 'Должность', 398, 386, 230, 40, 'HR coordinator');
  input(frame, 'Подразделение', 650, 386, 230, 40, 'Центр карьеры');
  button(frame, 'Сохранить профиль', 398, 470, 180, 42, true);
}
function updateDesktopMyApplicationsFull(frame) {
  desktopBase(frame, 'Мои заявки', 'student');
  text(frame, 'Title', 'Мои заявки', 42, 82, 420, 34, C.text, 'bold', 1.05);
  rect(frame, 'Profile', 42, 138, 260, 330, C.card, C.stroke, 16);
  text(frame, 'Profile title', 'Профиль', 70, 168, 220, 20, C.text, 'bold', 1.1);
  text(frame, 'Profile text', 'Имя: Alex Miller\nПрограмма: Computer Science\nКурс: 3\nРезюме: alex_cv.pdf', 70, 212, 210, 13, C.text, 'regular', 1.4);
  button(frame, 'Редактировать профиль', 70, 384, 190, 38, false);
  rect(frame, 'Applications', 330, 138, frame.width - 372, 390, C.card, C.stroke, 16);
  text(frame, 'Apps title', 'Поданные отклики', 358, 168, 320, 20, C.text, 'bold', 1.1);
  const rows = [
    ['Стажер-аналитик данных', 'на рассмотрении', 'Офис исследовательских проектов', 'orange'],
    ['Ассистент IT-поддержки', 'интервью', 'Кафедра компьютерных наук', 'violet'],
    ['Помощник библиотечной службы', 'отправлена', 'Университетская библиотека', 'blue']
  ];
  rows.forEach((row, i) => {
    const y = 210 + i * 96;
    rect(frame, `Full application / ${row[0]}`, 358, y, frame.width - 428, 78, C.input, C.strokeSoft, 12);
    text(frame, `Full application title / ${row[0]}`, row[0], 374, y + 16, 300, 16, C.text, 'bold', 1.1);
    text(frame, `Full application meta / ${row[0]}`, row[2], 374, y + 43, 320, 12, C.muted, 'regular', 1);
    pill(frame, row[1], frame.width - 238, y + 24, 150, row[3]);
  });
  rect(frame, 'Student note', 358, 500, frame.width - 428, 52, C.hero, C.strokeSoft, 12);
  text(frame, 'Student note text', 'Сообщение работодателю и сопроводительное письмо отображаются внутри карточки заявки.', 374, 518, frame.width - 460, 12, C.text, 'regular', 1.2);
}
function updateDesktopEmployerApplicationExpanded(frame) {
  desktopBase(frame, 'Панель', 'employer');
  text(frame, 'Title', 'Отклики по вакансии', 42, 82, 520, 34, C.text, 'bold', 1.05);
  rect(frame, 'Vacancy selector', 42, 138, 300, 390, C.card, C.stroke, 16);
  text(frame, 'Selector title', 'Вакансии', 70, 168, 200, 20, C.text, 'bold', 1);
  ['Стажер-аналитик данных', 'Ассистент IT-поддержки', 'Помощник библиотечной службы'].forEach((name, i) => {
    const y = 212 + i * 74;
    rect(frame, `Vacancy row / ${name}`, 70, y, 238, 58, i === 0 ? C.hero : C.input, C.strokeSoft, 10);
    text(frame, `Vacancy row text / ${name}`, name, 84, y + 13, 155, 12, C.text, 'bold', 1.1);
    pill(frame, 'активна', 236, y + 15, 64, 'green');
  });
  rect(frame, 'Applications panel', 370, 138, frame.width - 412, 430, C.card, C.stroke, 16);
  text(frame, 'Panel title', 'Заявки студентов', 398, 168, 280, 20, C.text, 'bold', 1.1);
  rect(frame, 'Application summary', 398, 212, frame.width - 468, 80, C.input, C.strokeSoft, 12);
  text(frame, 'Student name', 'Alex Miller', 414, 228, 200, 16, C.text, 'bold', 1);
  text(frame, 'Student email', 'alex@example.com', 414, 252, 220, 12, C.muted, 'regular', 1);
  pill(frame, 'на рассмотрении', frame.width - 256, 238, 146, 'orange');
  button(frame, 'Скрыть детали', frame.width - 196, 248, 120, 32, false);
  rect(frame, 'Expanded details', 398, 314, frame.width - 468, 220, C.hero, C.strokeSoft, 12);
  text(frame, 'Resume', 'Резюме: alex_cv.pdf', 414, 336, 250, 13, C.text, 'bold', 1);
  text(frame, 'Student message', 'Сообщение: Хочу присоединиться к исследовательской команде и применить Python в реальном проекте.', 414, 370, frame.width - 500, 12, C.text, 'regular', 1.25);
  textareaBox(frame, 'Комментарий работодателя', 414, 424, frame.width - 650, 64, 'Пригласить на интервью');
  selectField(frame, 'Статус заявки', 'interview', frame.width - 220, 424, 130, 38);
  button(frame, 'Сохранить статус', frame.width - 220, 522, 150, 38, true);
}
function updateDesktopVacancyEditorExpanded(frame) {
  desktopBase(frame, 'Панель', 'employer');
  text(frame, 'Title', 'Редактор вакансии', 42, 82, 520, 34, C.text, 'bold', 1.05);
  rect(frame, 'Base settings', 42, 138, frame.width - 84, 138, C.card, C.stroke, 16);
  input(frame, 'Подразделение', 70, 168, 260, 40, 'Офис исследовательских проектов');
  selectField(frame, 'Тип', 'Стажировка', 350, 168, 180);
  selectField(frame, 'Статус', 'активна', 550, 168, 160);
  input(frame, 'Часы в неделю', 730, 168, 150, 40, '16');
  input(frame, 'Зарплата от', 70, 228, 180, 40, '600.00');
  input(frame, 'Зарплата до', 270, 228, 180, 40, '850.00');
  input(frame, 'Дедлайн', 470, 228, 180, 40, '2026-05-05');
  rect(frame, 'Base translation', 42, 300, 420, 252, C.card, C.stroke, 16);
  text(frame, 'Base translation title', 'RU базовый контент', 70, 330, 300, 20, C.text, 'bold', 1);
  input(frame, 'Название RU', 70, 372, 340, 38, 'Стажер-аналитик данных');
  textareaBox(frame, 'Описание RU', 70, 446, 340, 72, 'Работайте с исследовательскими командами над данными.');
  rect(frame, 'Optional translations', 490, 300, frame.width - 532, 252, C.card, C.stroke, 16);
  text(frame, 'Optional title', 'Необязательные локализации', 518, 330, 320, 20, C.text, 'bold', 1);
  text(frame, 'Optional note', 'EN и DE появляются только по кнопке. Если перевод не заполнен, backend может использовать сохранённый перевод.', 518, 368, frame.width - 590, 13, C.muted, 'regular', 1.25);
  button(frame, 'Добавить EN', 518, 424, 130, 38, false);
  button(frame, 'Добавить DE', 668, 424, 130, 38, false);
  button(frame, 'Сохранить вакансию', 518, 498, 180, 42, true);
  button(frame, 'Отмена', 716, 498, 110, 42, false);
}
function updateMobileLogin(frame) {
  mobileBase(frame, 'Профиль');
  text(frame, 'Title', 'Вход', 20, 90, 300, 30, C.text, 'bold', 1.1);
  rect(frame, 'Auth card', 20, 150, frame.width - 40, 260, C.card, C.stroke, 14);
  text(frame, 'Subtitle', 'Войдите, чтобы откликаться и видеть статусы заявок.', 34, 178, frame.width - 88, 13, C.muted, 'regular', 1.2);
  input(frame, 'Логин или email', 34, 230, frame.width - 68, 40, 'student@example.com');
  input(frame, 'Пароль', 34, 312, frame.width - 68, 40, '••••••••');
  button(frame, 'Войти', 34, 382, 110, 38, true);
  button(frame, 'Регистрация', 156, 382, 126, 38, false);
}
function updateMobileRegister(frame) {
  mobileBase(frame, 'Профиль');
  text(frame, 'Title', 'Регистрация', 20, 90, 300, 30, C.text, 'bold', 1.1);
  text(frame, 'Hint', 'Создаётся студенческий аккаунт.', 20, 130, 300, 13, C.muted, 'regular', 1);
  selectField(frame, 'Язык', 'Русский', 20, 168, frame.width - 40, 38);
  input(frame, 'Username', 20, 248, frame.width - 40, 38, 'alex.miller');
  input(frame, 'Email', 20, 328, frame.width - 40, 38, 'alex@example.com');
  input(frame, 'Имя', 20, 408, frame.width - 40, 38, 'Alex');
  input(frame, 'Фамилия', 20, 488, frame.width - 40, 38, 'Miller');
  input(frame, 'Пароль', 20, 568, frame.width - 40, 38, 'минимум 8 символов');
  input(frame, 'Повтор пароля', 20, 648, frame.width - 40, 38, 'повторите пароль');
  button(frame, 'Создать аккаунт', 20, frame.height - 128, frame.width - 40, 48, true);
}
function updateMobileStudentProfile(frame) {
  mobileBase(frame, 'Профиль');
  text(frame, 'Title', 'Профиль студента', 20, 90, 300, 24, C.text, 'bold', 1.1);
  rect(frame, 'Summary', 20, 138, frame.width - 40, 120, C.card, C.stroke, 14);
  text(frame, 'Name', 'Alex Miller', 34, 162, 250, 18, C.text, 'bold', 1);
  text(frame, 'Meta', 'Computer Science • 3 курс\nРезюме: alex_cv.pdf', 34, 194, 250, 12, C.text, 'regular', 1.25);
  input(frame, 'Имя', 20, 292, frame.width - 40, 38, 'Alex');
  input(frame, 'Фамилия', 20, 372, frame.width - 40, 38, 'Miller');
  selectField(frame, 'Язык', 'Русский', 20, 452, frame.width - 40, 38);
  input(frame, 'Программа', 20, 532, frame.width - 40, 38, 'Computer Science');
  input(frame, 'Курс', 20, 612, frame.width - 40, 38, '3');
  button(frame, 'Сохранить профиль', 20, frame.height - 128, frame.width - 40, 48, true);
}
function updateMobileEmployerProfile(frame) {
  mobileBase(frame, 'Профиль');
  text(frame, 'Title', 'Профиль работодателя', 20, 90, 320, 22, C.text, 'bold', 1.08);
  rect(frame, 'Summary', 20, 138, frame.width - 40, 120, C.card, C.stroke, 14);
  text(frame, 'Name', 'Maria Novak', 34, 162, 250, 18, C.text, 'bold', 1);
  text(frame, 'Meta', 'University Career Center\nHR coordinator', 34, 194, 250, 12, C.text, 'regular', 1.25);
  input(frame, 'Имя', 20, 292, frame.width - 40, 38, 'Maria');
  input(frame, 'Фамилия', 20, 372, frame.width - 40, 38, 'Novak');
  input(frame, 'Организация', 20, 452, frame.width - 40, 38, 'University Career Center');
  input(frame, 'Должность', 20, 532, frame.width - 40, 38, 'HR coordinator');
  input(frame, 'Подразделение', 20, 612, frame.width - 40, 38, 'Центр карьеры');
  button(frame, 'Сохранить профиль', 20, frame.height - 128, frame.width - 40, 48, true);
}
function updateMobileApplicationExpanded(frame) {
  mobileBase(frame, 'Профиль');
  text(frame, 'Title', 'Детали заявки', 20, 90, 300, 24, C.text, 'bold', 1.1);
  rect(frame, 'Application card', 20, 138, frame.width - 40, 430, C.card, C.stroke, 14);
  text(frame, 'Vacancy title', 'Стажер-аналитик данных', 34, 166, frame.width - 88, 18, C.text, 'bold', 1.1);
  pill(frame, 'на рассмотрении', 34, 214, 142, 'orange');
  text(frame, 'Resume title', 'Резюме', 34, 272, 260, 16, C.text, 'bold', 1);
  text(frame, 'Resume text', 'alex_cv.pdf', 34, 302, 260, 12, C.text, 'regular', 1);
  text(frame, 'Message title', 'Сообщение работодателю', 34, 350, 260, 16, C.text, 'bold', 1);
  text(frame, 'Message text', 'Хочу присоединиться к исследовательской команде и применить Python в реальном проекте.', 34, 382, frame.width - 88, 13, C.text, 'regular', 1.25);
  text(frame, 'Comment title', 'Комментарий работодателя', 34, 480, 260, 16, C.text, 'bold', 1);
  text(frame, 'Comment text', 'Заявка передана руководителю проекта.', 34, 510, frame.width - 88, 13, C.muted, 'regular', 1.2);
}
function updateMobileEmployerApplicationExpanded(frame) {
  mobileBase(frame, 'Панель');
  text(frame, 'Title', 'Отклик студента', 20, 90, 300, 24, C.text, 'bold', 1.1);
  rect(frame, 'Student summary', 20, 138, frame.width - 40, 110, C.card, C.stroke, 14);
  text(frame, 'Student name', 'Alex Miller', 34, 164, 220, 18, C.text, 'bold', 1);
  text(frame, 'Student email', 'alex@example.com', 34, 194, 220, 12, C.muted, 'regular', 1);
  pill(frame, 'на рассмотрении', frame.width - 172, 164, 136, 'orange');
  rect(frame, 'Details', 20, 278, frame.width - 40, 380, C.card, C.stroke, 14);
  text(frame, 'Resume', 'Резюме: alex_cv.pdf', 34, 304, frame.width - 88, 14, C.text, 'bold', 1);
  text(frame, 'Cover', 'Сопроводительное письмо', 34, 354, frame.width - 88, 16, C.text, 'bold', 1);
  text(frame, 'Cover text', 'Умею работать с Python и таблицами, готов подключиться к исследовательскому проекту.', 34, 386, frame.width - 88, 13, C.text, 'regular', 1.25);
  selectField(frame, 'Статус', 'interview', 34, 486, frame.width - 88, 38);
  textareaBox(frame, 'Комментарий', 34, 568, frame.width - 88, 70, 'Пригласить на интервью');
  button(frame, 'Сохранить статус', 20, frame.height - 128, frame.width - 40, 48, true);
}
const screenAliases = {
  'Home': 'D01 Home',
  'Vacancies List': 'D02 Jobs',
  'Vacancy Details': 'D03 Detail',
  'Apply Form': 'D04 Apply',
  'Student Dashboard / My Applications': 'D05 Student',
  'Employer Vacancy Management': 'D06 Employer',
  'Login': 'D07 Login',
  'Register': 'D08 Register',
  'Student Profile Edit': 'D09 Profile',
  'Employer Profile Edit': 'D10 Employer',
  'My Applications Full': 'D11 Apps',
  'Employer Application Expanded': 'D12 Reply',
  'Vacancy Editor With Optional Translations': 'D13 Editor',
  'Mobile Home': 'M01 Home',
  'Mobile Vacancies': 'M02 Jobs',
  'Mobile Vacancy Details': 'M03 Detail',
  'Mobile Apply': 'M04 Apply',
  'Mobile My Applications': 'M05 Apps',
  'Mobile Employer': 'M06 Employer',
  'Mobile Login': 'M07 Login',
  'Mobile Register': 'M08 Register',
  'Mobile Student Profile Edit': 'M09 Profile',
  'Mobile Employer Profile Edit': 'M10 Employer',
  'Mobile Application Expanded': 'M11 App',
  'Mobile Employer Application Expanded': 'M12 Reply'
};
const legacyScreenAliases = {
  'Vacancies List': 'D02 Vacancies',
  'Vacancy Details': 'D03 Details',
  'Student Profile Edit': 'D09 Student Profile',
  'Employer Profile Edit': 'D10 Employer Profile',
  'My Applications Full': 'D11 Applications',
  'Employer Application Expanded': 'D12 Employer Reply',
  'Vacancy Editor With Optional Translations': 'D13 Vacancy Editor',
  'Mobile Vacancies': 'M02 Vacancies',
  'Mobile Vacancy Details': 'M03 Details',
  'Mobile My Applications': 'M05 Applications',
  'Mobile Student Profile Edit': 'M09 Student Profile',
  'Mobile Employer Profile Edit': 'M10 Employer Profile',
  'Mobile Application Expanded': 'M11 Application',
  'Mobile Employer Application Expanded': 'M12 Employer Reply'
};
function frameNamesFor(name) {
  return [name, screenAliases[name], legacyScreenAliases[name]].filter(Boolean);
}
function findFrame(page, name) {
  const allowed = frameNamesFor(name);
  const node = page.findOne((n) => n.type === 'FRAME' && allowed.includes(n.name));
  return node && node.type === 'FRAME' ? node : null;
}
function ensureFrame(page, name, x, y, w, h) {
  let frame = findFrame(page, name);
  if (!frame) {
    frame = figma.createFrame();
    page.appendChild(frame);
    frame.name = name;
  }
  frame.x = x;
  frame.y = y;
  frame.resize(w, h);
  return frame;
}
function removePageLabel(page, name) {
  for (const node of page.findAll((n) => n.name === `Screen label / ${name}`)) {
    node.remove();
  }
}
function addPageLabel(page, name, x, y, w) {
  removePageLabel(page, name);
  // Frame names are already visible in Figma; extra canvas labels make the mockup noisy.
}
function desktopSlotData(page) {
  const home = findFrame(page, 'Home');
  const list = findFrame(page, 'Vacancies List');
  const details = findFrame(page, 'Vacancy Details');
  const apply = findFrame(page, 'Apply Form');
  if (!home) throw new Error('Home frame not found on 01 Desktop');
  const w = home.width;
  const h = home.height;
  const gapX = list ? Math.max(80, list.x - home.x - w) : 80;
  const gapY = apply ? Math.max(80, apply.y - home.y - h) : 80;
  const xs = [
    home.x,
    list ? list.x : home.x + w + gapX,
    details ? details.x : home.x + 2 * (w + gapX)
  ];
  const y0 = home.y;
  return { xs, y0, w, h, gapY };
}
function mobileSlotData(page) {
  const home = findFrame(page, 'Mobile Home');
  const list = findFrame(page, 'Mobile Vacancies');
  const details = findFrame(page, 'Mobile Vacancy Details');
  const apply = findFrame(page, 'Mobile Apply');
  if (!home) throw new Error('Mobile Home frame not found on 02 Mobile');
  const w = home.width;
  const h = home.height;
  const gapX = list ? Math.max(64, list.x - home.x - w) : 64;
  const gapY = apply ? Math.max(90, apply.y - home.y - h) : 90;
  const xs = [
    home.x,
    list ? list.x : home.x + w + gapX,
    details ? details.x : home.x + 2 * (w + gapX)
  ];
  const y0 = home.y;
  return { xs, y0, w, h, gapY };
}
function buildScreen(page, name, x, y, w, h, fn) {
  addPageLabel(page, name, x, y - 32, w);
  const frame = ensureFrame(page, name, x, y, w, h);
  fn(frame);
  return frame;
}
function removeMyImports(page) {
  const victims = page.findAll((n) => n.type === 'FRAME' && (
    n.name === 'Frame' ||
    n.name === 'Desktop Home' ||
    n.name === 'Mobile Home'
  ) && (
    Math.round(n.width) === 3960 || Math.round(n.width) === 1760 ||
    !!n.findOne((c) => String(c.name || '').includes('Current site UI') || String(c.name || '').includes('import title'))
  ));
  for (const node of victims) node.remove();
  return victims.length;
}
function getPages() {
  const desktop = figma.root.children.find((p) => p.name === '01 Desktop');
  const mobile = figma.root.children.find((p) => p.name === '02 Mobile');
  if (!desktop || !mobile) throw new Error('Не найдены страницы 01 Desktop и/или 02 Mobile');
  return { desktop, mobile };
}
async function saveVersion(title, description) {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  try {
    return await figma.saveVersionHistoryAsync(title, description);
  } catch (e) {
    return null;
  }
}
async function stageCleanup() {
  let removed = 0;
  for (const page of [...figma.root.children]) {
    await figma.setCurrentPageAsync(page);
    if (page.name === '03 Current Site UI') { page.remove(); removed++; continue; }
    removed += removeMyImports(page);
  }
  await saveVersion('01 Очистка', 'Удалены лишние импортированные элементы.');
  figma.closePlugin(`Stage 01 complete. Removed imports: ${removed}`);
}
async function updateFrames(page, entries) {
  const updated = [];
  await figma.setCurrentPageAsync(page);
  for (const [name, fn] of entries) {
    const frame = findFrame(page, name);
    if (frame) { fn(frame); updated.push(name); }
  }
  figma.viewport.scrollAndZoomIntoView(page.children.filter((n) => updated.includes(n.name)));
  return updated;
}
async function stageDesktopMain() {
  await loadFonts();
  const { desktop } = getPages();
  const updated = await updateFrames(desktop, [
    ['Home', updateDesktopHome],
    ['Vacancies List', updateDesktopVacancies],
    ['Vacancy Details', updateDesktopDetails]
  ]);
  await saveVersion('02 Десктоп: витрина', 'Главная, список и карточка вакансии.');
  figma.closePlugin(`Stage 02 complete. Updated desktop frames: ${updated.join(', ') || 'none'}`);
}
async function stageDesktopFlow() {
  await loadFonts();
  const { desktop } = getPages();
  const updated = await updateFrames(desktop, [
    ['Apply Form', updateDesktopApply],
    ['Student Dashboard / My Applications', updateDesktopStudent],
    ['Employer Vacancy Management', updateDesktopAdmin]
  ]);
  await saveVersion('03 Десктоп: сценарии', 'Отклик, кабинет и панель работодателя.');
  figma.closePlugin(`Stage 03 complete. Updated desktop frames: ${updated.join(', ') || 'none'}`);
}
async function stageMobileMain() {
  await loadFonts();
  const { mobile } = getPages();
  const updated = await updateFrames(mobile, [
    ['Mobile Home', updateMobileHome],
    ['Mobile Vacancies', updateMobileVacancies],
    ['Mobile Vacancy Details', updateMobileDetails]
  ]);
  await saveVersion('04 Мобайл: витрина', 'Главная, список и карточка вакансии.');
  figma.closePlugin(`Stage 04 complete. Updated mobile frames: ${updated.join(', ') || 'none'}`);
}
async function stageMobileFlow() {
  await loadFonts();
  const { mobile } = getPages();
  const updated = await updateFrames(mobile, [
    ['Mobile Apply', updateMobileApply],
    ['Mobile My Applications', updateMobileApps],
    ['Mobile Employer', updateMobileEmployer]
  ]);
  await saveVersion('05 Мобайл: сценарии', 'Отклик, заявки и панель работодателя.');
  figma.closePlugin(`Stage 05 complete. Updated mobile frames: ${updated.join(', ') || 'none'}`);
}
async function stageDesktopMissing() {
  await loadFonts();
  const { desktop } = getPages();
  await figma.setCurrentPageAsync(desktop);
  const { xs, y0, w, h, gapY } = desktopSlotData(desktop);
  const row3 = y0 + 2 * (h + gapY);
  const row4 = y0 + 3 * (h + gapY);
  const row5 = y0 + 4 * (h + gapY);
  const created = [
    buildScreen(desktop, 'Login', xs[0], row3, w, h, updateDesktopLogin),
    buildScreen(desktop, 'Register', xs[1], row3, w, h, updateDesktopRegister),
    buildScreen(desktop, 'Student Profile Edit', xs[2], row3, w, h, updateDesktopStudentProfile),
    buildScreen(desktop, 'Employer Profile Edit', xs[0], row4, w, h, updateDesktopEmployerProfile),
    buildScreen(desktop, 'My Applications Full', xs[1], row4, w, h, updateDesktopMyApplicationsFull),
    buildScreen(desktop, 'Employer Application Expanded', xs[2], row4, w, h, updateDesktopEmployerApplicationExpanded),
    buildScreen(desktop, 'Vacancy Editor With Optional Translations', xs[0], row5, w, h, updateDesktopVacancyEditorExpanded)
  ];
  figma.viewport.scrollAndZoomIntoView(created);
  await saveVersion('06 Десктоп: недостающее', 'Добавлены недостающие desktop-экраны.');
  figma.closePlugin(`Stage 06 complete. Added/updated desktop frames: ${created.length}`);
}
async function stageMobileMissing() {
  await loadFonts();
  const { mobile } = getPages();
  await figma.setCurrentPageAsync(mobile);
  const { xs, y0, w, h, gapY } = mobileSlotData(mobile);
  const row3 = y0 + 2 * (h + gapY);
  const row4 = y0 + 3 * (h + gapY);
  const created = [
    buildScreen(mobile, 'Mobile Login', xs[0], row3, w, h, updateMobileLogin),
    buildScreen(mobile, 'Mobile Register', xs[1], row3, w, h, updateMobileRegister),
    buildScreen(mobile, 'Mobile Student Profile Edit', xs[2], row3, w, h, updateMobileStudentProfile),
    buildScreen(mobile, 'Mobile Employer Profile Edit', xs[0], row4, w, h, updateMobileEmployerProfile),
    buildScreen(mobile, 'Mobile Application Expanded', xs[1], row4, w, h, updateMobileApplicationExpanded),
    buildScreen(mobile, 'Mobile Employer Application Expanded', xs[2], row4, w, h, updateMobileEmployerApplicationExpanded)
  ];
  figma.viewport.scrollAndZoomIntoView(created);
  await saveVersion('07 Мобайл: недостающее', 'Добавлены недостающие mobile-экраны.');
  figma.closePlugin(`Stage 07 complete. Added/updated mobile frames: ${created.length}`);
}
async function stageDesktopAuth() {
  await loadFonts();
  const { desktop } = getPages();
  await figma.setCurrentPageAsync(desktop);
  const { xs, y0, w, h, gapY } = desktopSlotData(desktop);
  const row3 = y0 + 2 * (h + gapY);
  const created = [
    buildScreen(desktop, 'Login', xs[0], row3, w, h, updateDesktopLogin),
    buildScreen(desktop, 'Register', xs[1], row3, w, h, updateDesktopRegister)
  ];
  figma.viewport.scrollAndZoomIntoView(created);
  await saveVersion('08 Десктоп: вход', 'Вход и регистрация.');
  figma.closePlugin(`Stage 08 complete. Added/updated desktop frames: ${created.length}`);
}
async function stageDesktopProfiles() {
  await loadFonts();
  const { desktop } = getPages();
  await figma.setCurrentPageAsync(desktop);
  const { xs, y0, w, h, gapY } = desktopSlotData(desktop);
  const row3 = y0 + 2 * (h + gapY);
  const row4 = y0 + 3 * (h + gapY);
  const created = [
    buildScreen(desktop, 'Student Profile Edit', xs[2], row3, w, h, updateDesktopStudentProfile),
    buildScreen(desktop, 'Employer Profile Edit', xs[0], row4, w, h, updateDesktopEmployerProfile)
  ];
  figma.viewport.scrollAndZoomIntoView(created);
  await saveVersion('09 Десктоп: профили', 'Профиль студента и работодателя.');
  figma.closePlugin(`Stage 09 complete. Added/updated desktop frames: ${created.length}`);
}
async function stageDesktopAppStates() {
  await loadFonts();
  const { desktop } = getPages();
  await figma.setCurrentPageAsync(desktop);
  const { xs, y0, w, h, gapY } = desktopSlotData(desktop);
  const row4 = y0 + 3 * (h + gapY);
  const row5 = y0 + 4 * (h + gapY);
  const created = [
    buildScreen(desktop, 'My Applications Full', xs[1], row4, w, h, updateDesktopMyApplicationsFull),
    buildScreen(desktop, 'Employer Application Expanded', xs[2], row4, w, h, updateDesktopEmployerApplicationExpanded),
    buildScreen(desktop, 'Vacancy Editor With Optional Translations', xs[0], row5, w, h, updateDesktopVacancyEditorExpanded)
  ];
  figma.viewport.scrollAndZoomIntoView(created);
  await saveVersion('10 Десктоп: заявки', 'Заявки, отклик и редактор вакансии.');
  figma.closePlugin(`Stage 10 complete. Added/updated desktop frames: ${created.length}`);
}
async function stageMobileAuth() {
  await loadFonts();
  const { mobile } = getPages();
  await figma.setCurrentPageAsync(mobile);
  const { xs, y0, w, h, gapY } = mobileSlotData(mobile);
  const row3 = y0 + 2 * (h + gapY);
  const created = [
    buildScreen(mobile, 'Mobile Login', xs[0], row3, w, h, updateMobileLogin),
    buildScreen(mobile, 'Mobile Register', xs[1], row3, w, h, updateMobileRegister)
  ];
  figma.viewport.scrollAndZoomIntoView(created);
  await saveVersion('11 Мобайл: вход', 'Вход и регистрация.');
  figma.closePlugin(`Stage 11 complete. Added/updated mobile frames: ${created.length}`);
}
async function stageMobileProfiles() {
  await loadFonts();
  const { mobile } = getPages();
  await figma.setCurrentPageAsync(mobile);
  const { xs, y0, w, h, gapY } = mobileSlotData(mobile);
  const row3 = y0 + 2 * (h + gapY);
  const row4 = y0 + 3 * (h + gapY);
  const created = [
    buildScreen(mobile, 'Mobile Student Profile Edit', xs[2], row3, w, h, updateMobileStudentProfile),
    buildScreen(mobile, 'Mobile Employer Profile Edit', xs[0], row4, w, h, updateMobileEmployerProfile)
  ];
  figma.viewport.scrollAndZoomIntoView(created);
  await saveVersion('12 Мобайл: профили', 'Профиль студента и работодателя.');
  figma.closePlugin(`Stage 12 complete. Added/updated mobile frames: ${created.length}`);
}
async function stageMobileAppStates() {
  await loadFonts();
  const { mobile } = getPages();
  await figma.setCurrentPageAsync(mobile);
  const { xs, y0, w, h, gapY } = mobileSlotData(mobile);
  const row4 = y0 + 3 * (h + gapY);
  const created = [
    buildScreen(mobile, 'Mobile Application Expanded', xs[1], row4, w, h, updateMobileApplicationExpanded),
    buildScreen(mobile, 'Mobile Employer Application Expanded', xs[2], row4, w, h, updateMobileEmployerApplicationExpanded)
  ];
  figma.viewport.scrollAndZoomIntoView(created);
  await saveVersion('13 Мобайл: заявки', 'Детали заявки и отклика.');
  figma.closePlugin(`Stage 13 complete. Added/updated mobile frames: ${created.length}`);
}
function removeAuditArtifacts(page) {
  const removed = [];
  const junkNames = new Set([
    'Frame',
    'Stage 1 subtitle',
    'PProject - Mobile Interface',
    'PProject - Desktop Interface'
  ]);
  for (const node of [...page.children]) {
    if (junkNames.has(String(node.name || ''))) {
      removed.push(`${page.name}: ${node.name}`);
      node.remove();
    }
  }
  return removed;
}
function desktopAuditSpecs(page) {
  const { xs, y0, w, h, gapY } = desktopSlotData(page);
  const row1 = y0 + h + gapY;
  const row2 = y0 + 2 * (h + gapY);
  const row3 = y0 + 3 * (h + gapY);
  const row4 = y0 + 4 * (h + gapY);
  return [
    ['Home', xs[0], y0, w, h, updateDesktopHome],
    ['Vacancies List', xs[1], y0, w, h, updateDesktopVacancies],
    ['Vacancy Details', xs[2], y0, w, h, updateDesktopDetails],
    ['Apply Form', xs[0], row1, w, h, updateDesktopApply],
    ['Student Dashboard / My Applications', xs[1], row1, w, h, updateDesktopStudent],
    ['Employer Vacancy Management', xs[2], row1, w, h, updateDesktopAdmin],
    ['Login', xs[0], row2, w, h, updateDesktopLogin],
    ['Register', xs[1], row2, w, h, updateDesktopRegister],
    ['Student Profile Edit', xs[2], row2, w, h, updateDesktopStudentProfile],
    ['Employer Profile Edit', xs[0], row3, w, h, updateDesktopEmployerProfile],
    ['My Applications Full', xs[1], row3, w, h, updateDesktopMyApplicationsFull],
    ['Employer Application Expanded', xs[2], row3, w, h, updateDesktopEmployerApplicationExpanded],
    ['Vacancy Editor With Optional Translations', xs[0], row4, w, h, updateDesktopVacancyEditorExpanded]
  ];
}
function mobileAuditSpecs(page) {
  const { xs, y0, w, h, gapY } = mobileSlotData(page);
  const row1 = y0 + h + gapY;
  const row2 = y0 + 2 * (h + gapY);
  const row3 = y0 + 3 * (h + gapY);
  return [
    ['Mobile Home', xs[0], y0, w, h, updateMobileHome],
    ['Mobile Vacancies', xs[1], y0, w, h, updateMobileVacancies],
    ['Mobile Vacancy Details', xs[2], y0, w, h, updateMobileDetails],
    ['Mobile Apply', xs[0], row1, w, h, updateMobileApply],
    ['Mobile My Applications', xs[1], row1, w, h, updateMobileApps],
    ['Mobile Employer', xs[2], row1, w, h, updateMobileEmployer],
    ['Mobile Login', xs[0], row2, w, h, updateMobileLogin],
    ['Mobile Register', xs[1], row2, w, h, updateMobileRegister],
    ['Mobile Student Profile Edit', xs[2], row2, w, h, updateMobileStudentProfile],
    ['Mobile Employer Profile Edit', xs[0], row3, w, h, updateMobileEmployerProfile],
    ['Mobile Application Expanded', xs[1], row3, w, h, updateMobileApplicationExpanded],
    ['Mobile Employer Application Expanded', xs[2], row3, w, h, updateMobileEmployerApplicationExpanded]
  ];
}
function createMissingScreens(page, specs) {
  const created = [];
  for (const [name, x, y, w, h, fn] of specs) {
    if (!findFrame(page, name)) {
      created.push(buildScreen(page, name, x, y, w, h, fn));
    }
  }
  return created;
}
function missingScreenNames(page, specs) {
  return specs.map(([name]) => name).filter((name) => !findFrame(page, name));
}
async function stageAuditFix() {
  await loadFonts();
  const { desktop, mobile } = getPages();
  const created = [];
  const removed = [];

  await figma.setCurrentPageAsync(desktop);
  removed.push(...removeAuditArtifacts(desktop));
  const desktopSpecs = desktopAuditSpecs(desktop);
  created.push(...createMissingScreens(desktop, desktopSpecs));

  await figma.setCurrentPageAsync(mobile);
  removed.push(...removeAuditArtifacts(mobile));
  const mobileSpecs = mobileAuditSpecs(mobile);
  created.push(...createMissingScreens(mobile, mobileSpecs));

  const missing = [
    ...missingScreenNames(desktop, desktopSpecs).map((name) => `01 Desktop / ${name}`),
    ...missingScreenNames(mobile, mobileSpecs).map((name) => `02 Mobile / ${name}`)
  ];
  if (missing.length) throw new Error(`Не хватает экранов: ${missing.join(', ')}`);

  if (created.length) figma.viewport.scrollAndZoomIntoView(created);
  if (created.length || removed.length) {
    await saveVersion('14 Проверка макета', `Добавлено: ${created.length}; удалено: ${removed.length}.`);
  }
  figma.closePlugin(`Stage 14 complete. Missing fixed: ${created.length}. Artifacts removed: ${removed.length}.`);
}
function removeAllScreenLabels(page) {
  const labels = page.findAll((n) => String(n.name || '').startsWith('Screen label /'));
  for (const label of labels) label.remove();
  return labels.length;
}
async function stageVisualPolish() {
  await loadFonts();
  const { desktop, mobile } = getPages();
  let removedLabels = 0;

  await figma.setCurrentPageAsync(desktop);
  removedLabels += removeAllScreenLabels(desktop);

  await figma.setCurrentPageAsync(mobile);
  removedLabels += removeAllScreenLabels(mobile);
  const updated = await updateFrames(mobile, [
    ['Mobile Home', updateMobileHome],
    ['Mobile Vacancies', updateMobileVacancies],
    ['Mobile Vacancy Details', updateMobileDetails],
    ['Mobile Apply', updateMobileApply],
    ['Mobile My Applications', updateMobileApps],
    ['Mobile Employer', updateMobileEmployer],
    ['Mobile Login', updateMobileLogin],
    ['Mobile Register', updateMobileRegister],
    ['Mobile Student Profile Edit', updateMobileStudentProfile],
    ['Mobile Employer Profile Edit', updateMobileEmployerProfile],
    ['Mobile Application Expanded', updateMobileApplicationExpanded],
    ['Mobile Employer Application Expanded', updateMobileEmployerApplicationExpanded]
  ]);

  await saveVersion('15 Визуальная правка', `Убраны служебные подписи: ${removedLabels}; обновлено mobile: ${updated.length}.`);
  figma.closePlugin(`Stage 15 complete. Removed screen labels: ${removedLabels}. Polished mobile frames: ${updated.length}.`);
}
function renameFrames(page, names) {
  let renamed = 0;
  for (const name of names) {
    const frame = findFrame(page, name);
    const shortName = screenAliases[name];
    if (frame && shortName && frame.name !== shortName) {
      frame.name = shortName;
      renamed++;
    }
  }
  return renamed;
}
async function stageTextFix() {
  await loadFonts();
  const { desktop, mobile } = getPages();
  let removedLabels = 0;

  await figma.setCurrentPageAsync(desktop);
  removedLabels += removeAllScreenLabels(desktop);
  const desktopUpdated = await updateFrames(desktop, [
    ['Home', updateDesktopHome],
    ['Vacancies List', updateDesktopVacancies],
    ['Vacancy Details', updateDesktopDetails],
    ['Apply Form', updateDesktopApply],
    ['Student Dashboard / My Applications', updateDesktopStudent],
    ['Employer Vacancy Management', updateDesktopAdmin],
    ['Login', updateDesktopLogin],
    ['Register', updateDesktopRegister],
    ['Student Profile Edit', updateDesktopStudentProfile],
    ['Employer Profile Edit', updateDesktopEmployerProfile],
    ['My Applications Full', updateDesktopMyApplicationsFull],
    ['Employer Application Expanded', updateDesktopEmployerApplicationExpanded],
    ['Vacancy Editor With Optional Translations', updateDesktopVacancyEditorExpanded]
  ]);
  const desktopRenamed = renameFrames(desktop, desktopUpdated);

  await figma.setCurrentPageAsync(mobile);
  removedLabels += removeAllScreenLabels(mobile);
  const mobileUpdated = await updateFrames(mobile, [
    ['Mobile Home', updateMobileHome],
    ['Mobile Vacancies', updateMobileVacancies],
    ['Mobile Vacancy Details', updateMobileDetails],
    ['Mobile Apply', updateMobileApply],
    ['Mobile My Applications', updateMobileApps],
    ['Mobile Employer', updateMobileEmployer],
    ['Mobile Login', updateMobileLogin],
    ['Mobile Register', updateMobileRegister],
    ['Mobile Student Profile Edit', updateMobileStudentProfile],
    ['Mobile Employer Profile Edit', updateMobileEmployerProfile],
    ['Mobile Application Expanded', updateMobileApplicationExpanded],
    ['Mobile Employer Application Expanded', updateMobileEmployerApplicationExpanded]
  ]);
  const mobileRenamed = renameFrames(mobile, mobileUpdated);

  await saveVersion('16 Правка текста', `Обновлены тексты и короткие названия: ${desktopUpdated.length + mobileUpdated.length}.`);
  figma.closePlugin(`Stage 16 complete. Desktop: ${desktopUpdated.length}, mobile: ${mobileUpdated.length}, labels removed: ${removedLabels}, renamed: ${desktopRenamed + mobileRenamed}.`);
}
function renameFlowFrame(page) {
  let renamed = 0;
  for (const node of [...page.children]) {
    if (node.type === 'FRAME' && (node.name === 'Frame' || node.name === 'User Flow')) {
      node.name = 'F01 Flow';
      renamed++;
    }
  }
  return renamed;
}
async function stageShortLabels() {
  await loadFonts();
  const { desktop, mobile } = getPages();
  const flow = figma.root.children.find((p) => p.name === '00 Flow');
  let renamed = 0;

  if (flow) {
    await figma.setCurrentPageAsync(flow);
    renamed += renameFlowFrame(flow);
  }

  await figma.setCurrentPageAsync(desktop);
  renamed += renameFrames(desktop, [
    'Home',
    'Vacancies List',
    'Vacancy Details',
    'Apply Form',
    'Student Dashboard / My Applications',
    'Employer Vacancy Management',
    'Login',
    'Register',
    'Student Profile Edit',
    'Employer Profile Edit',
    'My Applications Full',
    'Employer Application Expanded',
    'Vacancy Editor With Optional Translations'
  ]);

  await figma.setCurrentPageAsync(mobile);
  renamed += renameFrames(mobile, [
    'Mobile Home',
    'Mobile Vacancies',
    'Mobile Vacancy Details',
    'Mobile Apply',
    'Mobile My Applications',
    'Mobile Employer',
    'Mobile Login',
    'Mobile Register',
    'Mobile Student Profile Edit',
    'Mobile Employer Profile Edit',
    'Mobile Application Expanded',
    'Mobile Employer Application Expanded'
  ]);

  await saveVersion('17 Короткие подписи', `Укорочены подписи фреймов: ${renamed}.`);
  figma.closePlugin(`Stage 17 complete. Renamed frames: ${renamed}.`);
}
async function main() {
  const command = figma.command || '';
  if (command === 'stage-cleanup') return stageCleanup();
  if (command === 'stage-desktop-main') return stageDesktopMain();
  if (command === 'stage-desktop-flow') return stageDesktopFlow();
  if (command === 'stage-mobile-main') return stageMobileMain();
  if (command === 'stage-mobile-flow') return stageMobileFlow();
  if (command === 'stage-desktop-missing') return stageDesktopMissing();
  if (command === 'stage-mobile-missing') return stageMobileMissing();
  if (command === 'stage-desktop-auth') return stageDesktopAuth();
  if (command === 'stage-desktop-profiles') return stageDesktopProfiles();
  if (command === 'stage-desktop-app-states') return stageDesktopAppStates();
  if (command === 'stage-mobile-auth') return stageMobileAuth();
  if (command === 'stage-mobile-profiles') return stageMobileProfiles();
  if (command === 'stage-mobile-app-states') return stageMobileAppStates();
  if (command === 'stage-audit-fix') return stageAuditFix();
  if (command === 'stage-visual-polish') return stageVisualPolish();
  if (command === 'stage-text-fix') return stageTextFix();
  if (command === 'stage-short-labels') return stageShortLabels();
  figma.closePlugin('Select a numbered updater stage from Plugins > Development > PProject Direct UI Updater.');
}
main().catch((error) => {
  figma.closePlugin(`PProject updater failed: ${error.message}`);
});
