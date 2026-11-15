/* Plate 450 brand: draws the crest (dark-background version) on a canvas, used on share cards. Shapes match brand/plate450-mark-dark.svg. */
(function (root) {
  'use strict';
  var NUMERALS = [
    { d: 'M754.00 1176.00 332.00 551.00H754.00ZM690.00 1493.00H1118.00V551.00H1331.00V272.00H1118.00V0.00H754.00V272.00H92.00V602.00Z', x: 100.42, y: 142.00, s: 0.023193 },
    { d: 'M217.00 1493.00H1174.00V1210.00H524.00V979.00Q568.00 991.00 612.50 997.50Q657.00 1004.00 705.00 1004.00Q978.00 1004.00 1130.00 867.50Q1282.00 731.00 1282.00 487.00Q1282.00 245.00 1116.50 108.00Q951.00 -29.00 657.00 -29.00Q530.00 -29.00 405.50 -4.50Q281.00 20.00 158.00 70.00V373.00Q280.00 303.00 389.50 268.00Q499.00 233.00 596.00 233.00Q736.00 233.00 816.50 301.50Q897.00 370.00 897.00 487.00Q897.00 605.00 816.50 673.00Q736.00 741.00 596.00 741.00Q513.00 741.00 419.00 719.50Q325.00 698.00 217.00 653.00Z', x: 133.47, y: 142.00, s: 0.023193 },
    { d: 'M942.00 748.00Q942.00 1028.00 889.50 1142.50Q837.00 1257.00 713.00 1257.00Q589.00 1257.00 536.00 1142.50Q483.00 1028.00 483.00 748.00Q483.00 465.00 536.00 349.00Q589.00 233.00 713.00 233.00Q836.00 233.00 889.00 349.00Q942.00 465.00 942.00 748.00ZM1327.00 745.00Q1327.00 374.00 1167.00 172.50Q1007.00 -29.00 713.00 -29.00Q418.00 -29.00 258.00 172.50Q98.00 374.00 98.00 745.00Q98.00 1117.00 258.00 1318.50Q418.00 1520.00 713.00 1520.00Q1007.00 1520.00 1167.00 1318.50Q1327.00 1117.00 1327.00 745.00Z', x: 166.53, y: 142.00, s: 0.023193 }
  ];
  var PATHS = null;
  function crest(x, cx, cy, size) {
    var k = size / 300;
    if (!PATHS) PATHS = NUMERALS.map(function (n) { return { p: new Path2D(n.d), x: n.x, y: n.y, s: n.s }; });
    x.save();
    x.translate(cx - size / 2, cy - size / 2); x.scale(k, k);
    x.beginPath(); x.arc(150, 150, 142, 0, Math.PI * 2); x.lineWidth = 6; x.strokeStyle = '#EF9F27'; x.stroke();
    x.beginPath(); x.arc(150, 150, 126, 0, Math.PI * 2); x.fillStyle = '#2C2C2A'; x.fill();
    x.beginPath(); x.moveTo(84, 84); x.lineTo(216, 84); x.lineTo(216, 150); x.lineTo(150, 216); x.lineTo(84, 150); x.closePath();
    x.fillStyle = '#EF9F27'; x.fill(); x.lineWidth = 4; x.lineJoin = 'miter'; x.strokeStyle = '#412402'; x.stroke();
    PATHS.forEach(function (n) { x.save(); x.translate(n.x, n.y); x.scale(n.s, -n.s); x.fillStyle = '#412402'; x.fill(n.p); x.restore(); });
    x.restore();
  }
  root.Brand = { NAME: 'Plate 450', PRODUCT: 'Dugout Diary', crest: crest, colors: { charcoal: '#2C2C2A', gold: '#EF9F27', brown: '#412402', cream: '#F5EFE0' } };
})(typeof window !== 'undefined' ? window : this);
