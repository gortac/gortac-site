(function () {
  "use strict";
  var form = document.getElementById("contact-form");
  if (!form) return;

  var MAX_FILES = 3;
  var MAX_TOTAL = 8 * 1024 * 1024;
  var startedAt = Date.now();
  var endpoint = (form.getAttribute("data-endpoint") || "").trim();
  var errorBox = document.getElementById("form-error");
  var submitBtn = document.getElementById("submit");
  var fileInput = document.getElementById("files");
  var fileList = document.getElementById("file-list");

  // ?type=estimate → mark as estimate request
  try {
    var params = new URLSearchParams(location.search);
    if (params.get("type") === "estimate") {
      document.getElementById("request").value = "見積依頼";
      document.getElementById("estimate-note").hidden = false;
      document.querySelector("h1").textContent = "お見積のご依頼";
    }
  } catch (e) {}

  function show(id, on, text) {
    var el = document.getElementById(id);
    if (!el) return;
    if (text) el.textContent = text;
    el.hidden = !on;
  }
  function mark(input, bad) {
    if (input) input.setAttribute("aria-invalid", bad ? "true" : "false");
  }

  function validate() {
    var firstBad = null;
    var typeChecked = form.querySelector('input[name="type"]:checked');
    show("err-type", !typeChecked);
    if (!typeChecked) firstBad = firstBad || form.querySelector('input[name="type"]');

    var ln = form.lastName, fn = form.firstName;
    var nameBad = !ln.value.trim() || !fn.value.trim();
    mark(ln, !ln.value.trim()); mark(fn, !fn.value.trim());
    show("err-name", nameBad);
    if (nameBad) firstBad = firstBad || (!ln.value.trim() ? ln : fn);

    var email = form.email;
    var emailBad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    mark(email, emailBad); show("err-email", emailBad);
    if (emailBad) firstBad = firstBad || email;

    var tel = form.tel;
    var telBad = tel.value.trim() !== "" && !/^[0-9０-９\-－ー+() ]{6,20}$/.test(tel.value.trim());
    mark(tel, telBad); show("err-tel", telBad);
    if (telBad) firstBad = firstBad || tel;

    var msg = form.message;
    var msgBad = !msg.value.trim();
    mark(msg, msgBad); show("err-message", msgBad);
    if (msgBad) firstBad = firstBad || msg;

    var filesBad = checkFiles();
    if (filesBad) firstBad = firstBad || fileInput;

    var agree = form.agree;
    show("err-agree", !agree.checked);
    if (!agree.checked) firstBad = firstBad || agree;

    return firstBad;
  }

  function checkFiles() {
    var files = Array.prototype.slice.call(fileInput.files || []);
    var total = files.reduce(function (s, f) { return s + f.size; }, 0);
    var msg = "";
    if (files.length > MAX_FILES) msg = "添付できるファイルは3点までです。";
    else if (total > MAX_TOTAL) msg = "添付ファイルの合計が8MBを超えています。送信後にメールまたはLINEでお送りください。";
    show("err-files", !!msg, msg);
    mark(fileInput, !!msg);
    return !!msg;
  }

  fileInput.addEventListener("change", function () {
    fileList.innerHTML = "";
    Array.prototype.forEach.call(fileInput.files || [], function (f) {
      var li = document.createElement("li");
      li.textContent = f.name + "（" + Math.ceil(f.size / 1024) + "KB）";
      fileList.appendChild(li);
    });
    checkFiles();
  });

  function readFile(f) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () {
        var s = String(r.result);
        resolve({ name: f.name, type: f.type || "application/octet-stream", data: s.slice(s.indexOf(",") + 1) });
      };
      r.onerror = function () { reject(new Error("ファイルを読み込めませんでした：" + f.name)); };
      r.readAsDataURL(f);
    });
  }

  function fail(text) {
    errorBox.textContent = text;
    errorBox.hidden = false;
    errorBox.scrollIntoView({ block: "center" });
    submitBtn.disabled = false;
    submitBtn.textContent = "この内容で送信する";
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    errorBox.hidden = true;
    var bad = validate();
    if (bad) {
      fail("入力内容を確認してください。赤字の項目に修正が必要です。");
      bad.focus();
      return;
    }
    if (!endpoint) {
      fail("現在はプレビュー版のため、フォームは送信されません。公開版で送信できるようになります。");
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = "送信しています…";

    var cats = Array.prototype.map.call(form.querySelectorAll('input[name="category"]:checked'), function (c) { return c.value; });
    var tsInput = form.querySelector('input[name="cf-turnstile-response"]');
    var payload = {
      request: form.request.value,
      type: form.querySelector('input[name="type"]:checked').value,
      company: form.company.value.trim(),
      lastName: form.lastName.value.trim(),
      firstName: form.firstName.value.trim(),
      email: form.email.value.trim(),
      tel: form.tel.value.trim(),
      category: cats.join("、"),
      quantity: form.quantity.value.trim(),
      deadline: form.deadline.value.trim(),
      budget: form.budget.value.trim(),
      message: form.message.value.trim(),
      website: form.website.value,
      elapsed: Math.round((Date.now() - startedAt) / 1000),
      turnstile: tsInput ? tsInput.value : "",
      page: location.href
    };

    Promise.all(Array.prototype.map.call(fileInput.files || [], readFile))
      .then(function (files) {
        payload.files = files;
        return fetch(endpoint, { method: "POST", body: JSON.stringify(payload), redirect: "follow" });
      })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.ok) {
          location.href = "thanks.html";
        } else {
          fail((data && data.message) || "送信できませんでした。時間をおいて再度お試しいただくか、メールでご連絡ください。");
        }
      })
      .catch(function () {
        fail("通信エラーのため送信できませんでした。電波の良い場所で再度お試しいただくか、メールまたはLINEでご連絡ください。");
      });
  });
})();
