
import md5 from 'md5';

function validatePassword(inputPassword, encryptedPassword) {
    var inputPasswordHash = sha256(inputPassword);
    if (window.$docsify.auth.use == "md5") {
        inputPasswordHash = md5(inputPassword);
    }
    return inputPasswordHash === encryptedPassword;
}

function injectStyle() {
    const styleEl = document.createElement("style");
    styleEl.textContent = `
    #auth-dialog {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 250px;
        width: 400px;
        border: 1px solid #eee;
        margin: 0 auto;
        margin-top: 20px;
      }
      #auth-dialog input {
        margin: 10px 0;
        padding: 10px;
        font-size: 16px;
      }
      #auth-dialog button {
        padding: 10px 20px;
        font-size: 16px;
      }
      #auth-dialog error-message {
        color: red;
        margin-top: 10px;
      }
    `;
    document.head.insertBefore(styleEl, document.querySelector("head style, head link[rel*='stylesheet']"));
}

function injectAuthDialog() {
    let auth = window.$docsify.auth;
    let divEl = document.createElement('div');
    divEl.id = "auth-dialog";
    divEl.style.display = "none";
    divEl.innerHTML = `
        <span style="font-size:22px;font-weight:bold;">${auth.title}</span>
		<div id="g_id_onload" data-client_id="${auth.client_id}" data-callback="onSignIn">
		<div class="g_id_signin" data-type="standard"></div>
        <p id="error-message" style="color: red; display: none;">密码错误，无法访问。</p>
    `;
    document.getElementsByTagName("body")[0].appendChild(divEl);
}

function setAuthDialog(isShow) {
    if (isShow) {
        document.getElementById('auth-dialog').style.display = 'flex';
        if (document.getElementsByClassName('github-corner')[0]) {
            document.getElementsByClassName('github-corner')[0].style.display='none';
        }
        document.getElementsByTagName('main')[0].style.display='none';
        document.getElementsByTagName('nav')[0].style.display='none';
    } else {
        document.getElementById('auth-dialog').style.display = 'none';
        if (document.getElementsByClassName('github-corner')[0]) {
            document.getElementsByClassName('github-corner')[0].style.display='block';
        }
        document.getElementsByTagName('main')[0].style.display='block';
        document.getElementsByTagName('nav')[0].style.display='block';
    }
}

export function install (hook, vm) {
    hook.init(function() {
        injectStyle();
        injectAuthDialog();
    });
    hook.beforeEach(function(content) {
        let rm = window.$docsify.routeMode;
        var currentPath = window.location.hash.split('?')[0].split('#')[1] || '/';
        if (rm == "history") {
            currentPath = window.location.hash.split('?')[0].split('#')[0] || '/';
        }
        console.info("currentPath:" + currentPath);
        var needAuth = null;
        let auth = window.$docsify.auth;
        let paths = auth.paths;
        for (var i = 0; i < paths.length; i++) {
            if (new RegExp(paths[i]).test(currentPath)) {
                needAuth = true;
                break;
            }
        }
        if (auth.enable && needAuth && !sessionStorage.getItem('authenticated')) {
            setAuthDialog(true);
            window.checkPassword = function() {
                let pwd = document.getElementById("auth-pwd").value;
                if (validatePassword(pwd, window.$docsify.auth.password)) {
                    sessionStorage.setItem('authenticated', 'true');
                    setAuthDialog(false);
                } else {
                    document.getElementById('error-message').style.display = 'block';
                }
            }
            return '<div style="color:red;">第一次认证成功后，请重新刷新即可查看内容！</div>';
        } else {
            setAuthDialog(false);
            return content;
        }
    });
}