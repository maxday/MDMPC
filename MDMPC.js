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

var width = 1000;
var maxCarLength = 60;

var myTab = new Array();

function getXCoordinateFromAngle(angle, radius) {
	return Math.cos(angle*Math.PI/180) * radius;
}

function getYCoordinateFromAngle(angle, radius) {
	return Math.sin(angle*Math.PI/180) * radius;
}

//compute the value for each slice and return the amount of levels
function computeAnglesAndAddThemToPath(data) {
    var summedAngles = 0;
    var max = 0;

    if(typeof data.category != "undefined") {
        for(var i=0; i<data.category.length; ++i) {
        	max = Math.max(1+computeAnglesAndAddThemToPath(data.category[i]));
            summedAngles  = summedAngles + parseInt(data.category[i].value);
        }
		data.value = summedAngles;
		return max;
    }
    return 0;
}

function draw(bigData, idx, levelNumber, parentId) {

	idx = typeof idx !== 'undefined' ? idx : 0;
	levelNumber = typeof levelNumber !== 'undefined' ? levelNumber : 0;
	parentId = typeof parentId !== 'undefined' ? parentId : 0;

	var currentData;

	if(typeof bigData.category != "undefined") {
		currentData = bigData.category[idx];
	}

	if(typeof myTab[levelNumber] == "undefined") {
        myTab.push(0);
    }
	
	if(typeof bigData.category != "undefined") {

		if(typeof bigData.value != "undefined")
			currentData.ratio = (currentData.value/bigData.value)*bigData.ratio;
		else 
			currentData.ratio = 1;

		var newId = drawSlice(levelNumber, currentData.value, 360*myTab[levelNumber], 360*currentData.ratio, currentData.color, currentData.label, parentId);
		myTab[levelNumber] = myTab[levelNumber] + currentData.ratio;
	}

    if(typeof currentData.category != "undefined") {
    	var stepColor = 1/currentData.category.length;
        for(var i=0; i<currentData.category.length; ++i) {
            if(typeof currentData.category[i].color == "undefined") {
				currentData.category[i].color = lightColor(currentData.color, ((i+1) * stepColor));	
			}	
			draw (currentData, i, levelNumber+1, newId);   
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
function buildStringPath(slice) {
	return " M " + slice.startPointInside.xCoordinate + "," + slice.startPointInside.yCoordinate +
		  	" A " + getSmallRadius(slice.level) + "," + getSmallRadius(slice.level) + 
		  	" 0 " + slice.flagInside.largeArcFlag + "," + slice.flagInside.sweepFlag + " " + slice.endPointInside.xCoordinate + 
		  	"," + slice.endPointInside.yCoordinate +
			" L " + slice.endPointOutside.xCoordinate + "," + slice.endPointOutside.yCoordinate +
			" A " + getBigRadius(slice.level) + "," + getBigRadius(slice.level) + 
			" 0 " + slice.flagOutside.largeArcFlag + "," + slice.flagOutside.sweepFlag + " " + slice.startPointOutside.xCoordinate + 
			"," + slice.startPointOutside.yCoordinate;					   
}


//draw and add the slice to the svg
function drawSlice(level, realValue, angleStart, angleValue, color, label, parentId) {

	//@todo fix this ugly hack ask stackoverflow
	if(angleValue == 360)
		angleValue = 359.99;
	
	var center = width/2;
    
	var startPointInside = new Point(center + getXCoordinateFromAngle(angleStart, getSmallRadius(level)), center - getYCoordinateFromAngle(angleStart, getSmallRadius(level)));
	var startPointOutside = new Point(center + getXCoordinateFromAngle(angleStart, getBigRadius(level)), center - getYCoordinateFromAngle(angleStart, getBigRadius(level)));
	
	var endPointInside = new Point(center + getXCoordinateFromAngle(angleStart+angleValue, getSmallRadius(level)), center - getYCoordinateFromAngle(angleStart+angleValue, getSmallRadius(level)));
	var endPointOutside = new Point(center + getXCoordinateFromAngle(angleStart+angleValue, getBigRadius(level)), center - getYCoordinateFromAngle(angleStart+angleValue, getBigRadius(level)))
	
	var currentComputedId = "pathIdD"+Math.random();
	
	var newPath = document.createElementNS("http://www.w3.org/2000/svg","path");
	
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

	newPath.setAttributeNS(null, "d", buildStringPath(slice));			
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


//handler on a slice
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
	document.getElementById("breadCrumbs").innerHTML = "";
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

//class point
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

		if(label.length > maxCarLength) {
			label =  label.substring(0,maxCarLength) + "...";	
		}
		
		var breadCrumbItem = new BreadCrumbItem(slice.getAttribute("fill"), label, slice.getAttribute("valueAngle"), slice.getAttribute("valueReal"));
		breadCrumbs.push(breadCrumbItem);
		currentSelectedSliceId = slice.getAttribute("valueParent");
	}
	
	return breadCrumbs;
}


var nbLevels = computeAnglesAndAddThemToPath(data.category[0]) + 1;


draw(data);


