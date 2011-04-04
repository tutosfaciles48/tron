Pen = function(canv, canvW, canvH) 
{
    this.canv = canv;
    this.canvW = canvW;
    this.canvH = canvH;
}
Pen.prototype.clear = function(color) 
{
    this.canv.fillStyle = color;
    this.canv.fillRect(0, 0, this.canvW, this.canvH);
}
Pen.prototype.rect = function(x, y, width, height, color) 
{
    this.canv.fillStyle = color;
    this.canv.fillRect(x, y, width, height);
}
Pen.prototype.line = function(fromX, fromY, toX, toY, thickness) 
{
    this.canv.lineWidth = thickness;
    this.canv.moveTo(fromX, fromY);
    this.canv.lineTo(toX, toY);
}
Pen.prototype.ink = function(color)
{
    this.canv.strokeStyle = color;
    this.canv.stroke();
}
