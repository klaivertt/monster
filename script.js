window.requestAnimFrame = function () {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback);
    }
  );
};

function init(elemid) {
  let canvas = document.getElementById(elemid),
    c = canvas.getContext("2d"),
    w = (canvas.width = window.innerWidth),
    h = (canvas.height = window.innerHeight);
  c.fillStyle = "rgba(30,30,30,1)";
  c.fillRect(0, 0, w, h);
  return { c: c, canvas: canvas };
}

window.onload = function () {
  let { c, canvas } = init("canvas");
  let w = (canvas.width = window.innerWidth);
  let h = (canvas.height = window.innerHeight);
  let mouse = { x: false, y: false };
  let last_mouse = {};

  function dist(p1x, p1y, p2x, p2y) {
    return Math.sqrt(Math.pow(p2x - p1x, 2) + Math.pow(p2y - p1y, 2));
  }

  class segment {
    constructor(parent, l, a, first) {
      this.first = first;
      if (first) {
        this.pos = {
          x: parent.x,
          y: parent.y,
        };
      } else {
        this.pos = {
          x: parent.nextPos.x,
          y: parent.nextPos.y,
        };
      }
      this.l = l;
      this.ang = a;
      this.nextPos = {
        x: this.pos.x + this.l * Math.cos(this.ang),
        y: this.pos.y + this.l * Math.sin(this.ang),
      };
    }
    update(t) {
      this.ang = Math.atan2(t.y - this.pos.y, t.x - this.pos.x);
      this.pos.x = t.x + this.l * Math.cos(this.ang - Math.PI);
      this.pos.y = t.y + this.l * Math.sin(this.ang - Math.PI);
      this.nextPos.x = this.pos.x + this.l * Math.cos(this.ang);
      this.nextPos.y = this.pos.y + this.l * Math.sin(this.ang);
    }
    fallback(t) {
      this.pos.x = t.x;
      this.pos.y = t.y;
      this.nextPos.x = this.pos.x + this.l * Math.cos(this.ang);
      this.nextPos.y = this.pos.y + this.l * Math.sin(this.ang);
    }
    show() {
      c.lineTo(this.nextPos.x, this.nextPos.y);
    }
    setColor(color) {
      this.color = color;
    }
  }

  class tentacle {
    constructor(x, y, l, n, a) {
      this.x = x;
      this.y = y;
      this.l = l;
      this.n = n;
      this.t = {};
      this.rand = Math.random();
      this.color = "darkcyan";
      this.segments = [new segment(this, this.l / this.n, 0, true)];
      for (let i = 1; i < this.n; i++) {
        this.segments.push(
          new segment(this.segments[i - 1], this.l / this.n, 0, false)
        );
      }
    }
    move(last_target, target) {
      this.angle = Math.atan2(target.y - this.y, target.x - this.x);
      this.dt = dist(last_target.x, last_target.y, target.x, target.y) + 5;
      this.t = {
        x: target.x - 0.8 * this.dt * Math.cos(this.angle),
        y: target.y - 0.8 * this.dt * Math.sin(this.angle),
      };
      if (this.t.x) {
        this.segments[this.n - 1].update(this.t);
      } else {
        this.segments[this.n - 1].update(target);
      }
      for (let i = this.n - 2; i >= 0; i--) {
        this.segments[i].update(this.segments[i + 1].pos);
      }
      if (
        dist(this.x, this.y, target.x, target.y) <=
        this.l + dist(last_target.x, last_target.y, target.x, target.y)
      ) {
        this.segments[0].fallback({ x: this.x, y: this.y });
        for (let i = 1; i < this.n; i++) {
          this.segments[i].fallback(this.segments[i - 1].nextPos);
        }
      }
    }
    show(target) {
      if (dist(this.x, this.y, target.x, target.y) <= this.l) {
        c.globalCompositeOperation = "lighter";
        c.beginPath();
        c.lineTo(this.x, this.y);
        for (let i = 0; i < this.n; i++) {
          this.segments[i].show();
        }
        c.strokeStyle = this.color;
        c.lineWidth = this.rand * 2;
        c.lineCap = "round";
        c.lineJoin = "round";
        c.stroke();
        c.globalCompositeOperation = "source-over";
      }
    }
    show2(target) {
      c.beginPath();
      if (dist(this.x, this.y, target.x, target.y) <= this.l) {
        c.arc(this.x, this.y, 2 * this.rand + 1, 0, 2 * Math.PI);
        c.fillStyle = "white";
      } else {
        c.arc(this.x, this.y, this.rand * 2, 0, 2 * Math.PI);
        c.fillStyle = this.color;
      }
      c.fill();
    }
    setColor(color) {
      this.color = color;
    }
  }

  let maxl = 150,
    minl = 10,
    n = 30,
    numt = 3700,
    tent = [],
    clicked = false,
    target = { x: 0, y: 0 },
    last_target = {},
    t = 0,
    q = 10;

  for (let i = 0; i < numt; i++) {
    tent.push(
      new tentacle(
        Math.random() * w,
        Math.random() * h,
        Math.random() * (maxl - minl) + minl,
        n,
        Math.random() * 2 * Math.PI
      )
    );
  }

  function draw() {
    if (mouse.x) {
      target.errx = mouse.x - target.x;
      target.erry = mouse.y - target.y;
    } else {
      target.errx =
        w / 2 +
        ((h / 2 - q) * Math.sqrt(2) * Math.cos(t)) /
          (Math.pow(Math.sin(t), 2) + 1) -
        target.x;
      target.erry =
        h / 2 +
        ((h / 2 - q) * Math.sqrt(2) * Math.cos(t) * Math.sin(t)) /
          (Math.pow(Math.sin(t), 2) + 1) -
        target.y;
    }

    target.x += target.errx / 10;
    target.y += target.erry / 10;

    t += 0.01;

    c.beginPath();
    c.arc(
      target.x,
      target.y,
      dist(last_target.x, last_target.y, target.x, target.y) + 4,
      0,
      2 * Math.PI
    );
    c.fillStyle = "hsl(210,100%,80%)";
    c.fill();

    for (let i = 0; i < numt; i++) {
      tent[i].move(last_target, target);
      tent[i].show2(target);
    }
    for (let i = 0; i < numt; i++) {
      tent[i].show(target);
    }
    last_target.x = target.x;
    last_target.y = target.y;
  }

  canvas.addEventListener(
    "mousemove",
    function (e) {
      last_mouse.x = mouse.x;
      last_mouse.y = mouse.y;

      mouse.x = e.pageX - this.offsetLeft;
      mouse.y = e.pageY - this.offsetTop;
    },
    false
  );

  canvas.addEventListener("mouseleave", function (e) {
    mouse.x = false;
    mouse.y = false;
  });

  canvas.addEventListener(
    "mousedown",
    function (e) {
      clicked = true;
    },
    false
  );

  canvas.addEventListener(
    "mouseup",
    function (e) {
      clicked = false;
    },
    false
  );

  function loop() {
    window.requestAnimFrame(loop);
    c.clearRect(0, 0, w, h);
    draw();
  }

  window.addEventListener("resize", function () {
    (w = canvas.width = window.innerWidth),
      (h = canvas.height = window.innerHeight);
    loop();
  });

  loop();
  setInterval(loop, 1000 / 60);

  const colorButton = document.getElementById("colorButton");
  colorButton.addEventListener("click", changeColors);

  function generateRandomColor() {
    const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
    return randomColor;
  }

  function changeColors() {
    const activeColor = generateRandomColor();
    const inactiveColor = generateRandomColor();

    for (let i = 0; i < numt; i++) {
      if (i % 2 === 0) {
        tent[i].setColor(activeColor);
      } else {
        tent[i].setColor(inactiveColor);
      }
    }

    // Mettre à jour la couleur du bouton
    colorButton.style.background = activeColor;

    // Déterminer la luminosité de la couleur active
    const activeBrightness = calculateBrightness(activeColor);

    // Mettre à jour la couleur du texte en fonction de la luminosité de la couleur active
    if (activeBrightness > 125) {
      colorButton.style.color = "#000000"; // Texte foncé pour couleur claire
    } else {
      colorButton.style.color = "#FFFFFF"; // Texte clair pour couleur foncée
    }
  }

// Récupérer la référence de la case à cocher RGB
const rgbCheckbox = document.getElementById("rgbCheckbox");

// Ajouter un écouteur d'événement pour le changement de la case à cocher
rgbCheckbox.addEventListener("change", function() {
  if (rgbCheckbox.checked) {
    // La case à cocher est cochée, démarrer l'effet de changement de couleur
    startColorChangeEffect();
  } else {
    // La case à cocher est décochée, arrêter l'effet de changement de couleur
    stopColorChangeEffect();
  }
});

// Identifiant de l'intervalle pour la fonction changeColors
let intervalId;

// Fonction pour démarrer l'effet de changement de couleur
function startColorChangeEffect() {
  // Vérifier si l'effet est déjà en cours
  if (intervalId) return;

  const colors = [
    "#FF2020","#FF651F","#FFC520","#FFEC20","#FFFF20","#F7FF45","#BDFF4F","#9CFC4F","#79EF4F","#52D352","#38F77A","#20FF8F","#20FDAD",
    "#20FFFF","#20D0FF","#3EB0FF","#5089FF","#6180FF","#7097F7","#80AEF0","#90C5E9","#A0DCE2","#B0F3DB","#C0FAD4","#D1FFCD","#E1FFC6",
    "#F1FFBF","#FFFFB8","#FFEAB1","#FFD5AA","#FFC0A3","#FFAB9C","#FF9695","#FF818E","#FF6C87","#FF577F","#FF4268","#FF2D50","#FF1848",
    "#FF033F","#FF0A4C","#FF117A","#FF1898","#FF20B5","#FF27D3","#FF2EF0","#FF36FE","#FFA020","#FF841F","#FF671E","#FF4B1D","#FF2F1C",
    "#FF121B","#DE131A","#BD1419","#9C1518","#7B1617","#5A1716","#391816","#206134","#3A4A4F","#52565A","#6C7C65","#85827A","#9FA07F",
    "#B9B584","#D3D389","#EDEC8E","#FFFF93","#FFF498","#FFE59D","#FFD69F","#FFC8A0","#FFBAA2","#FFABA4","#FF9DA5","#FF8FA7","#FF81A9",
    "#FF73AA","#FF65AC","#FF57AE","#FF49AF","#FF3BAF","#FF2DAF","#FF20B0","#FF24C1","#FF28D2","#FF2CDF","#FF31EC","#FF35F9",
    "#FF39FF",
    "#FF54FF",
    "#FF6FFF",
    "#FF8BFF",
    "#FFA7FF",
    "#FFC2FF",
    "#FFDEFF",
    "#FFE2F2",
    "#FFE6E5",
    "#FFEBD9",
    "#FFF0CC",
    "#FFF4C0",
    "#FFF9B4",
    "#FFFDAA",
    "#FFFF9E",
    "#FFFF93",
    "#CFFF77",
    "#9FFF5B",
    "#80FF3F",
    "#61FF23",
    "#43FF07",
    "#34E406",
    "#26C60A",
    "#17A80F",
    "#099A13",
    "#008D18",
    "#007F1C",
    "#007120",
    "#006424",
    "#005728",
    "#004B2C",
    "#00402F",
    "#003433",
    "#002837",
    "#001C3B",
    "#00103F",
    "#000543",
    "#000047",
    "#260045",
    "#4C0043",
    "#720041",
    "#98003F",
    "#BE003D",
    "#E4003C",
    "#FF003A",
    "#FF003B",
    "#FF003D",
    "#FF003E",
    "#FF0040",
    "#FF0041",
    "#FF0043",
    "#FF0044",
    "#FF0046",
    "#FF0048",
    "#FF0049",
    "#FF004B",
    "#FF004C",
    "#FF004E",
    "#FF004F",
    "#FF0051",
    "#FF0053",
    "#FF0054",
    "#FF0056",
    "#FF0057",
    "#FF0059",
    "#FF005A",
    "#FF005C",
    "#FF005E",
    "#FF005F",
    "#FF0061",
    "#FF0062",
    "#FF0064",
    "#FF0065",
    "#FF0067",
    "#FF0069",
    "#FF006A",
    "#FF006C",
    "#FF006D",
    "#FF006F",
    "#FF0071",
    "#FF0072",
    "#FF0074",
    "#FF0075",
    "#FF0077",
    "#FF0079",
    "#FF007A",
    "#FF007C",
    "#FF007D",
    "#FF007F",
    "#FF0081",
    "#FF0082",
    "#FF0084",
    "#FF0085",
    "#FF0087",
    "#FF0088",
    "#FF008A",
    "#FF008C",
    "#FF008D",
    "#FF008F",
    "#FF0090",
    "#FF0092",
    "#FF0093",
    "#FF0095",
    "#FF0097",
    "#FF0098",
    "#FF009A",
    "#FF009B",
    "#FF009D",
    "#FF009F",
    "#FF00A0",
    "#FF00A2",
    "#FF00A3",
    "#FF00A5",
    "#FF00A6",
    "#FF00A8",
    "#FF00AA",
    "#FF00AB",
    "#FF00AD",
    "#FF00AE",
    "#FF00B0",
    "#FF00B1",
    "#FF00B3",
    "#FF00B4",
    "#FF00B6",
    "#FF00B8",
    "#FF00B9",
    "#FF00BB",
    "#FF00BC",
    "#FF00BE",
    "#FF00C0",
    "#FF00C1",
    "#FF00C3",
    "#FF00C4",
    "#FF00C6",
    "#FF00C7",
    "#FF00C9",
    "#FF00CB",
    "#FF00CC",
    "#FF00CE",
    "#FF00CF",
    "#FF00D1",
    "#FF00D2",
    "#FF00D4",
    "#FF00D5",
    "#FF00D7",
    "#FF00D9",
    "#FF00DA",
    "#FF00DC",
    "#FF00DD",
    "#FF00DF",
    "#FF00E1",
    "#FF00E2",
    "#FF00E4",
    "#FF00E5",
    "#FF00E7",
    "#FF00E8",
    "#FF00EA",
    "#FF00EC",
    "#FF00ED",
    "#FF00EF","#FF00F0","#FF00F2","#FF00F3","#FF00F5",
  ];

  const duration = 100; // Durée entre chaque couleur en millisecondes
  const totalColors = colors.length;

  let currentIndex = 0;

  // Fonction pour obtenir la couleur suivante
  function getNextColor() {
    const color = colors[currentIndex];
    currentIndex = (currentIndex + 1) % totalColors;
    return color;
  }

  // Fonction pour changer la couleur active
  function changeColor() {
    const activeColor = getNextColor();

    // Appliquer la couleur active à l'élément ou à l'effet souhaité
    // Exemple : document.body.style.backgroundColor = activeColor;

    console.log("Changement de couleur RGB : ", activeColor);

    // Mettre à jour la couleur du bouton
    rgbCheckbox.style.background = activeColor;

    // Déterminer la luminosité de la couleur active
    const activeBrightness = calculateBrightness(activeColor);

    // Mettre à jour la couleur du texte en fonction de la luminosité de la couleur active
    if (activeBrightness > 125) {
      rgbCheckbox.style.color = "#000000"; // Texte foncé pour couleur claire
    } else {
      rgbCheckbox.style.color = "#FFFFFF"; // Texte clair pour couleur foncée
    }

    // Mettre à jour la couleur du monstre avec la nouvelle couleur active
    tent.forEach((monster, index) => {
      if (index % 2 === 0) {
        monster.setColor(activeColor);
      } else {
        monster.setColor(activeColor);
      }
    });
  }

  // Définir l'intervalle pour changer la couleur
  intervalId = setInterval(changeColor, duration);

  // Appeler la fonction pour la première fois sans délai initial
  changeColor();
}


}

// Variable globale pour stocker l'identifiant de l'intervalle
let intervalId;

// Fonction pour arrêter l'effet de changement de couleur
function stopColorChangeEffect() {
  // Vérifier si l'effet est en cours
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    // Réinitialiser la couleur de la case à cocher RGB
    const checkbox = document.getElementById("rgbCheckbox");
    checkbox.style.backgroundColor = "";
    // Réinitialiser la couleur du monstre
    const monster = document.getElementById("monster");
    monster.style.backgroundColor = "";
  }
  
  console.log("Effet de changement de couleur RGB désactivé.");
}

// Événement d'écoute sur la case à cocher RGB
const checkbox = document.getElementById("rgbCheckbox");
checkbox.addEventListener("change", function() {
  if (!this.checked) {
    stopColorChangeEffect();
  }
});

function changeRGBColors() {
  

  // Mettre à jour la couleur du monstre avec la couleur active
  tent.forEach((monster, index) => {
    if (index % 2 === 0) {
      monster.setColor(activeColor);
    } else {
      monster.setColor(inactiveColor);
    }
  });
}


  function calculateBrightness(color) {
    // Extraire les valeurs RGB de la couleur
    const r = parseInt(color.substring(1, 3), 16);
    const g = parseInt(color.substring(3, 5), 16);
    const b = parseInt(color.substring(5, 7), 16);

    // Calculer la luminosité en utilisant la formule appropriée
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness;
  }

