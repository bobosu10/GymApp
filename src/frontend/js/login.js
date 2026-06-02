const wallpapers = [
    "../assets/gymImage1.jpg",
    "../assets/gymImage2.jpg",
    "../assets/gymImage3.jpg",
    "../assets/gymImage4.jpg"
];

let currentImage = 0;

const wallpaper = document.getElementById("loginImage");

setInterval(() => {
    wallpaper.style.opacity = "0";

    setTimeout(() => {
        currentImage = (currentImage + 1) % wallpapers.length;
        wallpaper.src = wallpapers[currentImage];
        wallpaper.style.opacity = "1";
    }, 400);

}, 10000);