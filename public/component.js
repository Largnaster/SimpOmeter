// Code
var num = 10

$(() => {
    $('#nisekoi').click(() => {
        var text = document.getElementById("level")
        text.innerHTML = `<p>${suma()}%</p>`
        console.log(text.innerHTML)
    })
})

function suma() {
    num = Math.round(Math.random()*100)
    return num
}
