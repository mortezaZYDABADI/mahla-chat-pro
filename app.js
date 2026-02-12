const socket = io();

// کاربران و لیدرها
let currentUser = null;
let users = {};
let leaders = { leader: null, assistants: [] };

// ثبت نام
function register() {
  const name = document.getElementById("name").value;
  const age = document.getElementById("age").value;
  const gender = document.getElementById("gender").value;
  const city = document.getElementById("city").value;

  if(!name) return alert("نام الزامی است");

  currentUser = { name, age, gender, city, id: socket.id };
  socket.emit("register", currentUser);

  document.getElementById("register-container").style.display = "none";
  document.getElementById("chat-container").style.display = "flex";
}

// دریافت پیام خوش آمدگویی
socket.on("welcome", msg => alert(msg));

// نمایش کاربران آنلاین
socket.on("users", onlineUsers => {
  users = onlineUsers;
  const div = document.getElementById("users");
  div.innerHTML = "";
  Object.values(users).forEach(u => {
    let roleClass = "";
    if(u.id === leaders.leader) roleClass="leader";
    else if(leaders.assistants.includes(u.id)) roleClass="assistant";
    div.innerHTML += `<div class="${roleClass}">${u.name} ${roleClass==="leader"?"👑":roleClass==="assistant"?"🗿":""}</div>`;
  });
});

// دریافت پیام‌ها
socket.on("message", data => {
  const div = document.createElement("div");
  div.innerHTML = `<b>${data.user.name}:</b> ${data.text}`;
  document.getElementById("messages").appendChild(div);
});

// ارسال پیام
function sendMsg() {
  const input = document.getElementById("msgInput");
  if(input.value.trim() === "") return;
  socket.emit("message", input.value);
  input.value="";
}

// --------------------------
// TODO: توسعه تمام امکانات پیشرفته
// 1. سیستم لیدر و معاون لیدر 👑🗿
// 2. Timeout / Mute / Warn ⏱️
// 3. تغییر فونت، رنگ و تم 🎨 + چک رنگ
// 4. چت خصوصی 🔒
// 5. سیستم گزارش و ویرایش پیام ⚠️
// 6. سیستم رأی گیری تغییر لیدر 🗳️
// 7. پنجره چت شناور 🪟
// 8. ایموجی محدود 😎
// 9. تماس ویدئویی 🎥
// 10. پس‌زمینه متحرک ❤️🔥
// --------------------------
// سیستم لیدر و معاون
let warnings = {}; // ذخیره هشدارها {userId: count}
let mutedUsers = {}; // ذخیره کاربران سکوت شده {userId: timestamp پایان سکوت}

// تعیین لیدر و معاون
function assignAssistant() {
  const targetName = prompt("نام کاربری برای معاون:");
  const target = Object.values(users).find(u=>u.name===targetName);
  if(target){
    leaders.assistants.push(target.id);
    alert(target.name+" اکنون معاون است 🗿");
    socket.emit("updateRoles", leaders);
  }
}

function promoteToLeader() {
  if(currentUser && leaders.assistants.includes(currentUser.id)){
    leaders.leader = currentUser.id;
    alert("شما اکنون لیدر هستید 👑");
    socket.emit("updateRoles", leaders);
  }
}

// هشدار و سکوت
function warnUser() {
  const targetName = prompt("نام کاربری برای هشدار:");
  const target = Object.values(users).find(u=>u.name===targetName);
  if(!target) return alert("کاربر یافت نشد");
  
  warnings[target.id] = (warnings[target.id] || 0)+1;
  alert(`${target.name} هشدار ${warnings[target.id]} گرفت ⚠️`);

  if(warnings[target.id]>=3){
    mutedUsers[target.id] = Date.now() + 3*60*1000; // 3 دقیقه سکوت
    alert(`${target.name} به مدت 3 دقیقه سکوت شد ⏱️`);
    socket.emit("muteUser", {id:target.id, until:mutedUsers[target.id]});
    warnings[target.id] = 0; // ریست هشدارها
  }
}

// هنگام ارسال پیام چک می‌کنیم کاربر سکوت نشده باشه
function sendMsg() {
  if(mutedUsers[currentUser.id] && mutedUsers[currentUser.id]>Date.now()){
    return alert("شما در حالت سکوت هستید ⏱️");
  }
  const input = document.getElementById("msgInput");
  if(input.value.trim() === "") return;
  socket.emit("message", input.value);
  input.value="";
}

// نمایش دکمه‌ها فقط برای لیدر/معاون
function updateControls() {
  const div = document.getElementById("leader-controls");
  if(currentUser && (currentUser.id===leaders.leader || leaders.assistants.includes(currentUser.id))){
    div.style.display = "block";
  } else {
    div.style.display = "none";
  }
}

// هر بار کاربران تغییر کردن، کنترل‌ها رو آپدیت کن
socket.on("users", onlineUsers => {
  users = onlineUsers;
  updateControls();
});
