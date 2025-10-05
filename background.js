// Set a URL to open when the extension is uninstalled
chrome.runtime.setUninstallURL("https://forms.gle/xEnYdqNVrZeMe6LZ8");

const extpay = ExtPay('promptin')

extpay.getUser().then(user=>{
    console.log(user)
})