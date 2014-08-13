/*

Copyright (c) 2014 Maxime DAVID

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

*/

var alreadyDrawnSlices = new Array();
var width = 1000;
var nbLevels = drillDown(data);
var maxCarLength = 32;

//some convertion function
function toRad(angle) {
	return angle*Math.PI/180;
}

function getXFromAngle(angle, radius) {
 return Math.cos(toRad(angle)) * radius;
}

function getYFromAngle(angle, radius) {
 return Math.sin(toRad(angle)) * radius;
}

//get the SVG center 
//@TODO : make it dynamic
function getCenter() {
	return (width)/2;
}

//compute the sum for each nodes
//@todo refacto to parse just once
function computeAnglesAndAddThemToPath(data) {
    var summedAngles = 0;
    if(typeof data.category != "undefined") {
        for(var i=0; i<data.category.length; ++i) {
			summedAngles  = summedAngles + parseInt(data.category[i].value);
            computeAnglesAndAddThemToPath(data.category[i]);    
        }
		data.sum = summedAngles;
    }
}



computeAnglesAndAddThemToPath(data.category[0]);



drawDataAndDisplaySum(data.category[0], 1, 360, 360, 0, alreadyDrawnSlices);


//feed the alreadyDrawn table 
function drawDataAndDisplaySum(data, sum, previousLevelValue, previousAngle, rank, alreadyDrawnSlices, parentId) {
    if(typeof alreadyDrawnSlices[rank] == "undefined") {
        alreadyDrawnSlices.push(0);
    }
    var newId = performDrawSlice(rank, data.value, alreadyDrawnSlices[rank], (360*(data.value/sum)*previousAngle/360), data.color, data.label, parentId);
    alreadyDrawnSlices[rank]+= (360*(data.value/sum)*previousAngle/360); 
    if(typeof data.category != "undefined") {
		var stepColor = 1/data.category.length;
        for(var i=0; i<data.category.length; ++i) {
			if(typeof data.category[i].color == "undefined") {
				data.category[i].color = lightColor(data.color, ((i+1) * stepColor));	
			}		
            drawDataAndDisplaySum(data.category[i], data.sum, 360*data.value/sum, (360*data.value/sum)*previousLevelValue/360, rank+1, alreadyDrawnSlices, newId);    
        }
    }   
}

function getRadius(width, level, totalLevel, isSmall) {
	if(isSmall) {
		var min = width / 2;
		var scale = width - min;
		var step = scale/totalLevel;
		
		return step * (level+1);
	}
	
	
	//big
	var min = width / 4;
	var scale = width - min;
	var step = scale/totalLevel;
		return step * (level+1);
	
}


function sliceSize() {
	
	var maxSize = (width/2) * 90 / 100;
	var minSize = (width/2) * 10 / 100;
	
	return (maxSize-minSize)/nbLevels;
}

//@todo make it dynamic
function getSmallRadius(level) {
	return sliceSize()*(level+1);
}

//@todo make it dynamic
function getBigRadius(level) {
    return sliceSize()*(level+2);
}


//get the svg path from a slice
function getStringPath(slice) {
	return " M "+slice.startPointInside.xCoordinate+","+slice.startPointInside.yCoordinate+
			" A "+getSmallRadius(slice.level)+","+getSmallRadius(slice.level)+" 0 "+slice.flagInside.largeArcFlag+","+slice.flagInside.sweepFlag+" "+slice.endPointInside.xCoordinate+","+slice.endPointInside.yCoordinate+
			" L "+slice.endPointOutside.xCoordinate+","+slice.endPointOutside.yCoordinate+
			" A "+getBigRadius(slice.level)+","+getBigRadius(slice.level)+" 0 "+slice.flagOutside.largeArcFlag+","+slice.flagOutside.sweepFlag+" "+slice.startPointOutside.xCoordinate+","+slice.startPointOutside.yCoordinate;					   
}


//draw and add the slice to the svg
function performDrawSlice(level, realValue, angleStart, angleValue, color, label, parentId) {
    
	//@todo fix this ugly hack
	if(angleValue == 360)
		angleValue = 359.99;
	
	var center = getCenter();
    
	var startPointInside = new Point(center + getXFromAngle(angleStart, getSmallRadius(level)), center - getYFromAngle(angleStart, getSmallRadius(level)));
	var startPointOutside = new Point(center + getXFromAngle(angleStart, getBigRadius(level)), center - getYFromAngle(angleStart, getBigRadius(level)));
	
	var endPointInside = new Point(center + getXFromAngle(angleStart+angleValue, getSmallRadius(level)), center - getYFromAngle(angleStart+angleValue, getSmallRadius(level)));
	var endPointOutside = new Point(center + getXFromAngle(angleStart+angleValue, getBigRadius(level)), center - getYFromAngle(angleStart+angleValue, getBigRadius(level)))
	
	var currentComputedId = "pathIdD"+Math.random();
	
	newPath = document.createElementNS("http://www.w3.org/2000/svg","path");
	
	newPath.setAttributeNS(null, "id", currentComputedId);
	
	
	var insideFlag, outsideFlag;
	
	if(angleValue > 180) {
		insideFlag = new SliceFlag(1,0);
		outsideFlag = new SliceFlag(1,1);
	}
	else {
		insideFlag = new SliceFlag(0,0);
		outsideFlag = new SliceFlag(0,1);
	}
	
	var slice = new Slice(startPointInside, endPointInside, insideFlag, startPointOutside, endPointOutside, outsideFlag, level);

	newPath.setAttributeNS(null, "d", getStringPath(slice));			
    newPath.setAttributeNS(null, "stroke", color);
    newPath.setAttributeNS(null, "stroke-width", 1);
    newPath.setAttributeNS(null, "opacity", 1);
    newPath.setAttributeNS(null, "fill", color);
    //newPath.addEventListener('click', showSliceInfo);
    newPath.addEventListener('mouseover', showSliceInfoIn);
	newPath.addEventListener('mouseout', showSliceInfoOut);
	
    newPath.setAttributeNS(null, "valueAngle", angleValue);
    newPath.setAttributeNS(null, "valueLabel", label);
	newPath.setAttributeNS(null, "valueReal", realValue);
	newPath.setAttributeNS(null, "valueParent", parentId);

    
    document.getElementById("MDMultiplePieChart").appendChild(newPath);
	

	return currentComputedId;
	
}


//handler on aslice
function showSliceInfoIn(e) {
    //console.log(e.target.getAttributeNS(null, "valueLabel") + " - " + e.target.getAttributeNS(null, "valueAngle"));
	findPathFromSliceIdAndSetOpacity(e.target.getAttributeNS(null, "id"), 0.5);
	array = constructBreadCrumbs(e.target.getAttributeNS(null, "id"));
	
	var breadDiv = document.getElementById("breadCrumbs");
	
	breadDiv.innerHTML = "";

	//@todo fix the first tab thing
	for(var i=array.length-1; i>=0; --i) {
		
		var newDiv = document.createElement("div");
		newDiv.className = "breadCrumbItem";
		newDiv.textContent = array[i].label;
		
		newSpanPercent = document.createElement("span");
		newSpanPercent.className = "breadCrumbPercent";
		
		
		if(i!=array.length-1)
			newSpanPercent.textContent = array[i].value + " - " + (100*array[i].percent/360).toFixed(2) + "%"; 

		//todo make it a property
		newDiv.style.border = "1px solid " + array[i].color;
		newDiv.style.borderLeft = "8px solid " + array[i].color;
		
		newDiv.appendChild(newSpanPercent);
		breadDiv.appendChild(newDiv); 
		
	}


}

//hander on mouseOut
function showSliceInfoOut(e) {
	findPathFromSliceIdAndSetOpacity(e.target.getAttributeNS(null, "id"), 1);
	var breadDiv = document.getElementById("breadCrumbs");
	breadDiv.innerHTML = "";
}

//util function to handle opacity
function findPathFromSliceIdAndSetOpacity(sliceId, opacity) {
	var currentSelectedSliceId = sliceId;
	var slice;

	while(null != document.getElementById(currentSelectedSliceId)) {
		var slice = document.getElementById(currentSelectedSliceId);
		slice.style.opacity = opacity;
		//console.log(slice);
		currentSelectedSliceId = slice.getAttribute("valueParent");
	}
}

//class breadCrumb item
function BreadCrumbItem(color, label, percent, value) {
	this.color = color;
	this.label = label;
	this.percent = percent;
	this.value = value;
}

//class slice
function Slice(startPointInside, endPointInside, flagInside, startPointOutside, endPointOutside, flagOutside, level) {
	this.startPointInside = startPointInside;
	this.endPointInside = endPointInside;
	this.flagInside = flagInside; 
	this.startPointOutside = startPointOutside;
	this.endPointOutside = endPointOutside;
	this.flagOutside = flagOutside;
	this.level = level;
}

//class slice flag 
function SliceFlag(largeArcFlag, sweepFlag) {
	this.largeArcFlag = largeArcFlag;
	this.sweepFlag = sweepFlag;
}

//class slice info @todo : refacto, useless for now
function SliceInfo(angle, label, realValue, parent) {
	this.angle = angle;
	this.label = label;
	this.realValue = realValue;
	this.parent = parent;
}

//class point @todo refacto the nameWhichAreFarToooooooLong
function Point(xCoordinate, yCoordinate) {
	this.xCoordinate = xCoordinate;
	this.yCoordinate = yCoordinate;
}

//compute and construct the bradcrumb (by feeding an array (reversed))
function constructBreadCrumbs(sliceId) {

	var currentSelectedSliceId = sliceId;
	var slice;

	var breadCrumbs = new Array();
	while(null != document.getElementById(currentSelectedSliceId)) {
		var slice = document.getElementById(currentSelectedSliceId);
		
		var label = slice.getAttribute("valueLabel");
		if(label.length > maxCarLength)
		label =  label.substring(0,maxCarLength) + "...";
		
		var breadCrumbItem = new BreadCrumbItem(slice.getAttribute("fill"), label, slice.getAttribute("valueAngle"), slice.getAttribute("valueReal"));
		breadCrumbs.push(breadCrumbItem);
		currentSelectedSliceId = slice.getAttribute("valueParent");
	}
	
	return breadCrumbs;
}





function drillDown(data) {
    var max = 0;
    if(typeof data.category != "undefined") {
        for(var i=0; i<data.category.length; ++i) {
			max = Math.max(1+drillDown(data.category[i]), max);
        }
        return max;
    }
    return 0;
}