"use strict";

var CABLES=CABLES||{};
CABLES.OPS=CABLES.OPS||{};

var Ops=Ops || {};
Ops.Gl=Ops.Gl || {};
Ops.Vars=Ops.Vars || {};
Ops.Time=Ops.Time || {};
Ops.Math=Ops.Math || {};
Ops.Html=Ops.Html || {};
Ops.Anim=Ops.Anim || {};
Ops.Array=Ops.Array || {};
Ops.Value=Ops.Value || {};
Ops.Color=Ops.Color || {};
Ops.Boolean=Ops.Boolean || {};
Ops.Devices=Ops.Devices || {};
Ops.Trigger=Ops.Trigger || {};
Ops.Gl.Matrix=Ops.Gl.Matrix || {};
Ops.Gl.Shader=Ops.Gl.Shader || {};
Ops.Gl.Meshes=Ops.Gl.Meshes || {};
Ops.Gl.Geometry=Ops.Gl.Geometry || {};
Ops.Math.Compare=Ops.Math.Compare || {};
Ops.Devices.Mouse=Ops.Devices.Mouse || {};
Ops.Gl.ShaderEffects=Ops.Gl.ShaderEffects || {};
Ops.Gl.TextureEffects=Ops.Gl.TextureEffects || {};



// **************************************************************
// 
// Ops.Devices.Mouse.MouseWheel
// 
// **************************************************************

Ops.Devices.Mouse.MouseWheel = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const valIn=op.inValue("Value",0);
const mul=op.inValue("Multiply",1);
const minUnlimitedPort = op.inValueBool('Min Unlimited', false);
minUnlimitedPort.setUiAttribs({ hidePort: true });
const min=op.inValue("min",-100);
const maxUnlimitedPort = op.inValueBool('Max Unlimited', false);
maxUnlimitedPort.setUiAttribs({ hidePort: true });
const max=op.inValue("max", 100);
const smooth=op.inValueBool("smooth");
const smoothSpeed=op.inValue("delay",0.3);
const preventScroll=op.inValueBool("prevent scroll");
const flip=op.inValueBool("Flip Direction");
const active=op.inValueBool("active",true);
const reset=op.inTriggerButton("Reset");
const absVal=op.outValue("absolute value",0);
const delta=op.outValue("delta",0);

const cgl=op.patch.cgl;
var value=0;

var anim=new CABLES.Anim();
anim.defaultEasing=CABLES.TL.EASING_EXPO_OUT;

var startTime=CABLES.now()/1000.0;
var v=0;
var smoothTimer=0;

anim.clear();
anim.setValue(CABLES.now()/1000.0-startTime,absVal.get());
var dir=1;
var isWindows=navigator.appVersion.indexOf("Win")!=-1;

addListener();

min.onChange=function()
{
    checkValue();
    absVal.set( v );
};

max.onChange=function()
{
    checkValue();
    absVal.set( v );
};

minUnlimitedPort.onChange = function() {
    var minUnlimited = minUnlimitedPort.get();
    min.setUiAttribs({
        hidePort: minUnlimited,
        greyout: minUnlimited
    });
};

maxUnlimitedPort.onChange = function() {
    var maxUnlimited = maxUnlimitedPort.get();
    max.setUiAttribs({
        hidePort: maxUnlimited,
        greyout: maxUnlimited
    });
};

reset.onTriggered=function()
{
    anim.clear();
    anim.setValue(CABLES.now()/1000.0-startTime,valIn.get());
    absVal.set(valIn.get());
    v=0;
};

valIn.onChange=function()
{
    v=valIn.get();

    checkValue();

    absVal.set( v );

    anim.clear();
    anim.setValue(CABLES.now()/1000.0-startTime,absVal.get());

};

function updateSmooth()
{
    var v=anim.getValue( CABLES.now()/1000.0-startTime );

    absVal.set( v );
}

smooth.onChange=function()
{
    if(smooth.get()) smoothTimer = setInterval(updateSmooth, 15);
        else clearTimeout(smoothTimer);
};

// var isMac = navigator.platform.toUpperCase().indexOf('MAC')>=0;


function checkValue()
{
    if(!maxUnlimitedPort.get()) {
        v=Math.min(max.get(),v);
    }
    if(!minUnlimitedPort.get()) {
        v=Math.max(min.get(),v);
    }
}

flip.onChange=function()
{
    if(flip.get())dir=-1;
        else dir=1;
};

var vOut=0;

function onMouseWheel(e)
{
    var d= CGL.getWheelSpeed(e)*(dir)*mul.get();
    if(isWindows)d*=4;

    delta.set(0);
    delta.set(d);
    v-=d;
    checkValue();

    if( !smooth.get() )
    {
        absVal.set(v);
    }
    else
    {
        anim.clear();
        anim.setValue(CABLES.now()/1000.0-startTime,absVal.get());
        anim.setValue(CABLES.now()/1000.0-startTime+smoothSpeed.get(),v);
    }

    if(preventScroll.get()) e.preventDefault();
}

function addListener()
{
    cgl.canvas.addEventListener('wheel', onMouseWheel);
}

function removeListener()
{
    cgl.canvas.removeEventListener('wheel', onMouseWheel);
}


active.onChange=function()
{
    removeListener();
    if(active.get())addListener();
};



};

Ops.Devices.Mouse.MouseWheel.prototype = new CABLES.Op();
CABLES.OPS["40331e99-d2c6-4a0a-b5dd-385045aecd18"]={f:Ops.Devices.Mouse.MouseWheel,objName:"Ops.Devices.Mouse.MouseWheel"};




// **************************************************************
// 
// Ops.Gl.MainLoop
// 
// **************************************************************

Ops.Gl.MainLoop = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const fpsLimit=op.inValue("FPS Limit",0);
const trigger=op.outTrigger("trigger");
const width=op.outValue("width");
const height=op.outValue("height");
const reduceLoadingFPS=op.inValueBool("Reduce FPS loading");
const clear=op.inValueBool("Clear",true);
const fullscreen=op.inValueBool("Fullscreen Button",false);
const active=op.inValueBool("Active",true);
const hdpi=op.inValueBool("Hires Displays",false);

hdpi.onChange=function()
{
    if(hdpi.get()) op.patch.cgl.pixelDensity=window.devicePixelRatio;
        else op.patch.cgl.pixelDensity=1;
        
    op.patch.cgl.updateSize();
    if(CABLES.UI) gui.setLayout();
};


var cgl=op.patch.cgl;
var rframes=0;
var rframeStart=0;

if(!op.patch.cgl) op.uiAttr( { 'error': 'No webgl cgl context' } );

var identTranslate=vec3.create();
vec3.set(identTranslate, 0,0,0);
var identTranslateView=vec3.create();
vec3.set(identTranslateView, 0,0,-2);

fullscreen.onChange=updateFullscreenButton;
setTimeout(updateFullscreenButton,100);
var fsElement=null;

function updateFullscreenButton()
{
    function onMouseEnter()
    {
        if(fsElement)fsElement.style.display="block";
    }

    function onMouseLeave()
    {
        if(fsElement)fsElement.style.display="none";
    }
    
    op.patch.cgl.canvas.addEventListener('mouseleave', onMouseLeave);
    op.patch.cgl.canvas.addEventListener('mouseenter', onMouseEnter);

    if(fullscreen.get())
    {
        if(!fsElement) 
        {
            fsElement = document.createElement('div');

            var container = op.patch.cgl.canvas.parentElement;
            if(container)container.appendChild(fsElement);
    
            fsElement.addEventListener('mouseenter', onMouseEnter);
            fsElement.addEventListener('click', function(e)
            {
                if(CABLES.UI && !e.shiftKey) gui.cycleRendererSize();
                    else
                    {
                        cgl.fullScreen();
                    }
            });
        }

        fsElement.style.padding="10px";
        fsElement.style.position="absolute";
        fsElement.style.right="5px";
        fsElement.style.top="5px";
        fsElement.style.width="20px";
        fsElement.style.height="20px";
        // fsElement.style.opacity="1.0";
        fsElement.style.cursor="pointer";
        fsElement.style['border-radius']="40px";
        fsElement.style.background="#444";
        fsElement.style["z-index"]="9999";
        fsElement.style.display="none";
        fsElement.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Capa_1" x="0px" y="0px" viewBox="0 0 490 490" style="width:20px;height:20px;" xml:space="preserve" width="512px" height="512px"><g><path d="M173.792,301.792L21.333,454.251v-80.917c0-5.891-4.776-10.667-10.667-10.667C4.776,362.667,0,367.442,0,373.333V480     c0,5.891,4.776,10.667,10.667,10.667h106.667c5.891,0,10.667-4.776,10.667-10.667s-4.776-10.667-10.667-10.667H36.416     l152.459-152.459c4.093-4.237,3.975-10.99-0.262-15.083C184.479,297.799,177.926,297.799,173.792,301.792z" fill="#FFFFFF"/><path d="M480,0H373.333c-5.891,0-10.667,4.776-10.667,10.667c0,5.891,4.776,10.667,10.667,10.667h80.917L301.792,173.792     c-4.237,4.093-4.354,10.845-0.262,15.083c4.093,4.237,10.845,4.354,15.083,0.262c0.089-0.086,0.176-0.173,0.262-0.262     L469.333,36.416v80.917c0,5.891,4.776,10.667,10.667,10.667s10.667-4.776,10.667-10.667V10.667C490.667,4.776,485.891,0,480,0z" fill="#FFFFFF"/><path d="M36.416,21.333h80.917c5.891,0,10.667-4.776,10.667-10.667C128,4.776,123.224,0,117.333,0H10.667     C4.776,0,0,4.776,0,10.667v106.667C0,123.224,4.776,128,10.667,128c5.891,0,10.667-4.776,10.667-10.667V36.416l152.459,152.459     c4.237,4.093,10.99,3.975,15.083-0.262c3.992-4.134,3.992-10.687,0-14.82L36.416,21.333z" fill="#FFFFFF"/><path d="M480,362.667c-5.891,0-10.667,4.776-10.667,10.667v80.917L316.875,301.792c-4.237-4.093-10.99-3.976-15.083,0.261     c-3.993,4.134-3.993,10.688,0,14.821l152.459,152.459h-80.917c-5.891,0-10.667,4.776-10.667,10.667s4.776,10.667,10.667,10.667     H480c5.891,0,10.667-4.776,10.667-10.667V373.333C490.667,367.442,485.891,362.667,480,362.667z" fill="#FFFFFF"/></g></svg>';
    }
    else
    {
        if(fsElement)
        {
            fsElement.style.display="none";
            fsElement.remove();
            fsElement=null;
        }
    }
}


fpsLimit.onChange=function()
{
    op.patch.config.fpsLimit=fpsLimit.get()||0;
};

op.onDelete=function()
{
    cgl.gl.clearColor(0,0,0,0);
    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

    op.patch.removeOnAnimFrame(op);
};


op.patch.loading.setOnFinishedLoading(function(cb)
{
    op.patch.config.fpsLimit=fpsLimit.get();
});



op.onAnimFrame=function(time)
{
    if(!active.get())return;
    if(cgl.aborted || cgl.canvas.clientWidth===0 || cgl.canvas.clientHeight===0)return;

    if(op.patch.loading.getProgress()<1.0 && reduceLoadingFPS.get())
    {
        op.patch.config.fpsLimit=5;
    }

    if(cgl.canvasWidth==-1)
    {
        cgl.setCanvas(op.patch.config.glCanvasId);
        return;
    }

    if(cgl.canvasWidth!=width.get() || cgl.canvasHeight!=height.get())
    {
        // cgl.canvasWidth=cgl.canvas.clientWidth;
        width.set(cgl.canvasWidth);
        // cgl.canvasHeight=cgl.canvas.clientHeight;
        height.set(cgl.canvasHeight);
    }

    if(CABLES.now()-rframeStart>1000)
    {
        CGL.fpsReport=CGL.fpsReport||[];
        if(op.patch.loading.getProgress()>=1.0 && rframeStart!==0)CGL.fpsReport.push(rframes);
        rframes=0;
        rframeStart=CABLES.now();
    }
    CGL.MESH.lastShader=null;
    CGL.MESH.lastMesh=null;

    cgl.renderStart(cgl,identTranslate,identTranslateView);

    if(clear.get())
    {
        cgl.gl.clearColor(0,0,0,1);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
    }

    trigger.trigger();


    if(CGL.MESH.lastMesh)CGL.MESH.lastMesh.unBind();


    if(CGL.Texture.previewTexture)
    {
        if(!CGL.Texture.texturePreviewer) CGL.Texture.texturePreviewer=new CGL.Texture.texturePreview(cgl);
        CGL.Texture.texturePreviewer.render(CGL.Texture.previewTexture);
    }
    cgl.renderEnd(cgl);
    
    
    // cgl.printError('mainloop end');
    
    

    if(!cgl.frameStore.phong)cgl.frameStore.phong={};
    rframes++;
};


};

Ops.Gl.MainLoop.prototype = new CABLES.Op();
CABLES.OPS["b0472a1d-db16-4ba6-8787-f300fbdc77bb"]={f:Ops.Gl.MainLoop,objName:"Ops.Gl.MainLoop"};




// **************************************************************
// 
// Ops.Gl.Matrix.TransformView
// 
// **************************************************************

Ops.Gl.Matrix.TransformView = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    render=op.inTrigger('render'),
    posX=op.inValueFloat("posX"),
    posY=op.inValueFloat("posY"),
    posZ=op.inValueFloat("posZ"),
    scale=op.inValueFloat("scale"),
    rotX=op.inValueFloat("rotX"),
    rotY=op.inValueFloat("rotY"),
    rotZ=op.inValueFloat("rotZ"),
    trigger=op.outTrigger('trigger');

op.setPortGroup("Position",[posX,posY,posZ]);
op.setPortGroup("Scale",[scale]);
op.setPortGroup("Rotation",[rotX,rotZ,rotY]);

var cgl=op.patch.cgl;
var vPos=vec3.create();
var vScale=vec3.create();
var transMatrix = mat4.create();
mat4.identity(transMatrix);

var doScale=false;
var doTranslate=false;

var translationChanged=true;
var scaleChanged=true;
var rotChanged=true;

render.onTriggered=function()
{





    var updateMatrix=false;
    if(translationChanged)
    {
        updateTranslation();
        updateMatrix=true;
    }
    if(scaleChanged)
    {
        updateScale();
        updateMatrix=true;
    }
    if(rotChanged)
    {
        updateMatrix=true;
    }
    if(updateMatrix)doUpdateMatrix();

    cgl.pushViewMatrix();
    mat4.multiply(cgl.vMatrix,cgl.vMatrix,transMatrix);










    trigger.trigger();
    cgl.popViewMatrix();

    if(CABLES.UI && gui.patch().isCurrentOp(op))
        gui.setTransformGizmo(
            {
                posX:posX,
                posY:posY,
                posZ:posZ,
            });


};

op.transform3d=function()
{
    return {
            pos:[posX,posY,posZ]
        };

};

var doUpdateMatrix=function()
{
    mat4.identity(transMatrix);
    if(doTranslate)mat4.translate(transMatrix,transMatrix, vPos);

    if(rotX.get()!==0)mat4.rotateX(transMatrix,transMatrix, rotX.get()*CGL.DEG2RAD);
    if(rotY.get()!==0)mat4.rotateY(transMatrix,transMatrix, rotY.get()*CGL.DEG2RAD);
    if(rotZ.get()!==0)mat4.rotateZ(transMatrix,transMatrix, rotZ.get()*CGL.DEG2RAD);

    if(doScale)mat4.scale(transMatrix,transMatrix, vScale);
    rotChanged=false;
};

function updateTranslation()
{
    doTranslate=false;
    if(posX.get()!==0.0 || posY.get()!==0.0 || posZ.get()!==0.0) doTranslate=true;
    vec3.set(vPos, posX.get(),posY.get(),posZ.get());
    translationChanged=false;
}

function updateScale()
{
    doScale=false;
    if(scale.get()!==0.0)doScale=true;
    vec3.set(vScale, scale.get(),scale.get(),scale.get());
    scaleChanged=false;
}

var translateChanged=function()
{
    translationChanged=true;
};

var scaleChanged=function()
{
    scaleChanged=true;
};

var rotChanged=function()
{
    rotChanged=true;
};


rotX.onChange=rotChanged;
rotY.onChange=rotChanged;
rotZ.onChange=rotChanged;

scale.onChange=scaleChanged;

posX.onChange=translateChanged;
posY.onChange=translateChanged;
posZ.onChange=translateChanged;

rotX.set(0.0);
rotY.set(0.0);
rotZ.set(0.0);

scale.set(1.0);

posX.set(0.0);
posY.set(0.0);
posZ.set(0.0);

doUpdateMatrix();



};

Ops.Gl.Matrix.TransformView.prototype = new CABLES.Op();
CABLES.OPS["0b3e04f7-323e-4ac8-8a22-a21e2f36e0e9"]={f:Ops.Gl.Matrix.TransformView,objName:"Ops.Gl.Matrix.TransformView"};




// **************************************************************
// 
// Ops.Math.ApproachInterpolation
// 
// **************************************************************

Ops.Math.ApproachInterpolation = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
//look at http://sol.gfxile.net/interpolation/

var divisor=5;

var exec=op.inTrigger("Update");
var inVal=op.inValue("Value");

var next=op.outTrigger("Next");
var inDivisor=op.inValue("Divisor",divisor);
var result=op.outValue("Result",0);

var val=0;
var goal=0;

var lastTrigger=0;

inVal.onChange=function()
{
    goal=inVal.get();
};

inDivisor.onChange=function()
{
    divisor=inDivisor.get();
    if(divisor==0)divisor=5;
};

var oldVal=0;

exec.onTriggered=function()
{
    
    if(CABLES.now()-lastTrigger>500)val=inVal.get();
    lastTrigger=CABLES.now();


    if(divisor<=0)divisor=0.0001;
    val=val+(goal-val)/divisor;

    if(val>0 && val<0.000000001)val=0;
    if(divisor!=divisor)val=0;
    
    if(oldVal!=val)
    {
        result.set(val);
        oldVal=val;
    }
    
    next.trigger();
};

};

Ops.Math.ApproachInterpolation.prototype = new CABLES.Op();
CABLES.OPS["eb4aa728-d0ee-4c53-833d-d0b086b11250"]={f:Ops.Math.ApproachInterpolation,objName:"Ops.Math.ApproachInterpolation"};




// **************************************************************
// 
// Ops.Gl.Geometry.DivideGeometry
// 
// **************************************************************

Ops.Gl.Geometry.DivideGeometry = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};

var geometry=op.addInPort(new CABLES.Port(op,"Geometry",CABLES.OP_PORT_TYPE_OBJECT));
var outGeom=op.outObject("Result");

geometry.onChange=update;


function update()
{
    outGeom.set(null);
    if(geometry.get())
    {
        var geom=geometry.get();
        var newGeom=new CGL.Geometry();
        
        var newVerts=[];
        var newFaces=[];
        var newNormals=[];
        var newTexCoords=[];
        
        for(var i=0;i<geom.verticesIndices.length;i+=3)
        {
            newFaces.push( newVerts.length/3 );
            newVerts.push( geom.vertices[ geom.verticesIndices[i+0]*3+0] );
            newVerts.push( geom.vertices[ geom.verticesIndices[i+0]*3+1] );
            newVerts.push( geom.vertices[ geom.verticesIndices[i+0]*3+2] );
            newNormals.push( geom.vertexNormals[ geom.verticesIndices[i+0]*3+0] );
            newNormals.push( geom.vertexNormals[ geom.verticesIndices[i+0]*3+1] );
            newNormals.push( geom.vertexNormals[ geom.verticesIndices[i+0]*3+2] );
            newTexCoords.push( geom.texCoords[ geom.verticesIndices[i+0]*2+0] );
            newTexCoords.push( geom.texCoords[ geom.verticesIndices[i+0]*2+1] );

            newFaces.push( newVerts.length/3 );
            newVerts.push( geom.vertices[ geom.verticesIndices[i+1]*3+0] );
            newVerts.push( geom.vertices[ geom.verticesIndices[i+1]*3+1] );
            newVerts.push( geom.vertices[ geom.verticesIndices[i+1]*3+2] );
            newNormals.push( geom.vertexNormals[ geom.verticesIndices[i+1]*3+0] );
            newNormals.push( geom.vertexNormals[ geom.verticesIndices[i+1]*3+1] );
            newNormals.push( geom.vertexNormals[ geom.verticesIndices[i+1]*3+2] );
            newTexCoords.push( geom.texCoords[ geom.verticesIndices[i+1]*2+0] );
            newTexCoords.push( geom.texCoords[ geom.verticesIndices[i+1]*2+1] );

            newFaces.push( newVerts.length/3 );
            newVerts.push( geom.vertices[ geom.verticesIndices[i+2]*3+0] );
            newVerts.push( geom.vertices[ geom.verticesIndices[i+2]*3+1] );
            newVerts.push( geom.vertices[ geom.verticesIndices[i+2]*3+2] );
            newNormals.push( geom.vertexNormals[ geom.verticesIndices[i+2]*3+0] );
            newNormals.push( geom.vertexNormals[ geom.verticesIndices[i+2]*3+1] );
            newNormals.push( geom.vertexNormals[ geom.verticesIndices[i+2]*3+2] );
            newTexCoords.push( geom.texCoords[ geom.verticesIndices[i+2]*2+0] );
            newTexCoords.push( geom.texCoords[ geom.verticesIndices[i+2]*2+1] );
        }
        
        newGeom.vertices=newVerts;
        newGeom.vertexNormals=newNormals;
        newGeom.verticesIndices=newFaces;
        newGeom.setTexCoords(newTexCoords);

        outGeom.set(newGeom);
    }
}



};

Ops.Gl.Geometry.DivideGeometry.prototype = new CABLES.Op();
CABLES.OPS["ab0c768e-e684-47ba-b11f-f95d86532df2"]={f:Ops.Gl.Geometry.DivideGeometry,objName:"Ops.Gl.Geometry.DivideGeometry"};




// **************************************************************
// 
// Ops.Gl.TesselateGeometry
// 
// **************************************************************

Ops.Gl.TesselateGeometry = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var inGeom=op.inObject("Geometry");
var inTimes=op.inValueInt("Iterations",1);
var outGeom=op.outObject("Result");
var outVertices=op.outValue("Num Vertices");

inGeom.onChange=update;
inTimes.onChange=update;

function tesselateTC(tc, x1,y1, x2,y2,  x3,y3)
{
    tc.push( x1 );
    tc.push( y1 );

    tc.push( (x1+x2)/2 );
    tc.push( (y1+y2)/2 );

    tc.push( (x1+x3)/2 );
    tc.push( (y1+y3)/2 );

    // --

    tc.push( (x1+x2)/2 );
    tc.push( (y1+y2)/2 );

    tc.push( x2 );
    tc.push( y2 );

    tc.push( (x2+x3)/2 );
    tc.push( (y2+y3)/2 );

    // --

    tc.push( (x2+x3)/2 );
    tc.push( (y2+y3)/2 );

    tc.push( x3 );
    tc.push( y3 );

    tc.push( (x1+x3)/2 );
    tc.push( (y1+y3)/2 );

    // --

    tc.push( (x1+x2)/2 );
    tc.push( (y1+y2)/2 );

    tc.push( (x2+x3)/2 );
    tc.push( (y2+y3)/2 );

    tc.push( (x1+x3)/2 );
    tc.push( (y1+y3)/2 );
}

function tesselate(vertices, x1,y1,z1, x2,y2,z2, x3,y3,z3)
{

    vertices.push( x1 );
    vertices.push( y1 );
    vertices.push( z1 );

    vertices.push( (x1+x2)/2 );
    vertices.push( (y1+y2)/2 );
    vertices.push( (z1+z2)/2 );

    vertices.push( (x1+x3)/2 );
    vertices.push( (y1+y3)/2 );
    vertices.push( (z1+z3)/2 );

    // --

    vertices.push( (x1+x2)/2 );
    vertices.push( (y1+y2)/2 );
    vertices.push( (z1+z2)/2 );

    vertices.push( x2 );
    vertices.push( y2 );
    vertices.push( z2 );

    vertices.push( (x2+x3)/2 );
    vertices.push( (y2+y3)/2 );
    vertices.push( (z2+z3)/2 );

    // --

    vertices.push( (x2+x3)/2 );
    vertices.push( (y2+y3)/2 );
    vertices.push( (z2+z3)/2 );

    vertices.push( x3 );
    vertices.push( y3 );
    vertices.push( z3 );

    vertices.push( (x1+x3)/2 );
    vertices.push( (y1+y3)/2 );
    vertices.push( (z1+z3)/2 );

    // --

    vertices.push( (x1+x2)/2 );
    vertices.push( (y1+y2)/2 );
    vertices.push( (z1+z2)/2 );

    vertices.push( (x2+x3)/2 );
    vertices.push( (y2+y3)/2 );
    vertices.push( (z2+z3)/2 );

    vertices.push( (x1+x3)/2 );
    vertices.push( (y1+y3)/2 );
    vertices.push( (z1+z3)/2 );
}


function tesselateGeom(oldGeom)
{
    var geom=new CGL.Geometry();
    var vertices=[];
    var norms=[];
    var biTangents=[];
    var tangents=[];
    var tc=[];

    var i,j,k;

    if(oldGeom.verticesIndices.length>0)
    {
        for(i=0;i<oldGeom.verticesIndices.length;i+=3)
        {

            for(j=0;j<4;j++)
            for(k=0;k<3;k++)
            {
                norms.push(
                    oldGeom.vertexNormals[oldGeom.verticesIndices[i+k]*3+0],
                    oldGeom.vertexNormals[oldGeom.verticesIndices[i+k]*3+1],
                    oldGeom.vertexNormals[oldGeom.verticesIndices[i+k]*3+2]
                    );

                if(oldGeom.tangents)
                    tangents.push(
                        oldGeom.tangents[oldGeom.verticesIndices[i+k]*3+0],
                        oldGeom.tangents[oldGeom.verticesIndices[i+k]*3+1],
                        oldGeom.tangents[oldGeom.verticesIndices[i+k]*3+2]
                        );

                if(oldGeom.biTangents)
                    biTangents.push(
                        oldGeom.biTangents[oldGeom.verticesIndices[i+k]*3+0],
                        oldGeom.biTangents[oldGeom.verticesIndices[i+k]*3+1],
                        oldGeom.biTangents[oldGeom.verticesIndices[i+k]*3+2]
                        );


            }

            tesselate(vertices,
                oldGeom.vertices[oldGeom.verticesIndices[i+0]*3+0],
                oldGeom.vertices[oldGeom.verticesIndices[i+0]*3+1],
                oldGeom.vertices[oldGeom.verticesIndices[i+0]*3+2],

                oldGeom.vertices[oldGeom.verticesIndices[i+1]*3+0],
                oldGeom.vertices[oldGeom.verticesIndices[i+1]*3+1],
                oldGeom.vertices[oldGeom.verticesIndices[i+1]*3+2],

                oldGeom.vertices[oldGeom.verticesIndices[i+2]*3+0],
                oldGeom.vertices[oldGeom.verticesIndices[i+2]*3+1],
                oldGeom.vertices[oldGeom.verticesIndices[i+2]*3+2]
                );


            tesselateTC(tc,
                oldGeom.texCoords[oldGeom.verticesIndices[i+0]*2+0],
                oldGeom.texCoords[oldGeom.verticesIndices[i+0]*2+1],

                oldGeom.texCoords[oldGeom.verticesIndices[i+1]*2+0],
                oldGeom.texCoords[oldGeom.verticesIndices[i+1]*2+1],

                oldGeom.texCoords[oldGeom.verticesIndices[i+2]*2+0],
                oldGeom.texCoords[oldGeom.verticesIndices[i+2]*2+1]
                );
        }
    }
    else
    {
        if(oldGeom.vertices.length>0)
        {
            for(i=0;i<oldGeom.vertices.length;i+=9)
            {
                for(j=0;j<4;j++)
                {
                    for(k=0;k<9;k++)
                        norms.push(oldGeom.vertexNormals[i+k]);

                    if(oldGeom.tangents)
                        for(k=0;k<9;k++)
                            tangents.push(oldGeom.tangents[i+k]);

                    if(oldGeom.biTangents)
                        for(k=0;k<9;k++)
                            biTangents.push(oldGeom.biTangents[i+k]);

                }

                tesselate(vertices,
                    oldGeom.vertices[i+0],
                    oldGeom.vertices[i+1],
                    oldGeom.vertices[i+2],

                    oldGeom.vertices[i+3],
                    oldGeom.vertices[i+4],
                    oldGeom.vertices[i+5],

                    oldGeom.vertices[i+6],
                    oldGeom.vertices[i+7],
                    oldGeom.vertices[i+8]
                );

                tesselateTC(tc,
                    oldGeom.texCoords[i/9*6+0],
                    oldGeom.texCoords[i/9*6+1],

                    oldGeom.texCoords[i/9*6+2],
                    oldGeom.texCoords[i/9*6+3],

                    oldGeom.texCoords[i/9*6+4],
                    oldGeom.texCoords[i/9*6+5]

                    );

            }
        }
    }

    // console.log('norms',norms);
    geom.vertexNormals=norms;
    geom.setVertices(vertices);
    geom.setTexCoords(tc);
    geom.tangents=tangents;
    geom.biTangents=biTangents;
    return geom;

}

function update()
{
    var geom=inGeom.get();
    if(!geom)return;
        var startTime=CABLES.now();

    for(var i=0;i<inTimes.get();i++)
    {
        geom=tesselateGeom(geom);
    }

    outVertices.set(geom.vertices.length/3);
    console.log('tesselate time',CABLES.now()-startTime);

    outGeom.set(null);
    outGeom.set(geom);

}




};

Ops.Gl.TesselateGeometry.prototype = new CABLES.Op();
CABLES.OPS["eb3f0bd8-211c-4336-a3ad-fa31c50d705d"]={f:Ops.Gl.TesselateGeometry,objName:"Ops.Gl.TesselateGeometry"};




// **************************************************************
// 
// Ops.Gl.RenderGeometry
// 
// **************************************************************

Ops.Gl.RenderGeometry = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var render=op.inTrigger('render');

var geometry=op.addInPort(new CABLES.Port(op,"Geometry",CABLES.OP_PORT_TYPE_OBJECT));
geometry.ignoreValueSerialize=true;

var updateAll=op.inValueBool('Update All',true);
var updateFaces=op.inValueBool('Update Face Indices',false);
var updateVerts=op.inValueBool('Update Vertices',false);
var updateTexcoords=op.inValueBool('Update Texcoords',false);
var vertNums=op.inValueBool('Vertex Numbers',true);

var trigger=op.outTrigger('trigger');

vertNums.onChange=
    geometry.onChange=update;

var mesh=null;

render.onTriggered=function()
{
    if(mesh) mesh.render(op.patch.cgl.getShader());
    trigger.trigger();
};


function update()
{

    var geom=geometry.get();

    if(geom)
    {
        if(mesh)mesh.dispose();
        if(!mesh)
        {
            mesh=new CGL.Mesh(op.patch.cgl,geom);
            mesh.addVertexNumbers=vertNums.get();
            mesh.setGeom(geom);
        }


        if(updateFaces.get() || updateAll.get())
        {
            mesh.setVertexIndices(geom.verticesIndices);
        }

        if(updateTexcoords.get() || updateAll.get())
        {
            mesh.updateTexCoords(geom);
        }

        if(updateVerts.get() || updateAll.get())
        {
            mesh.updateVertices(geom);
        }

        mesh.addVertexNumbers=vertNums.get();


        if(updateAll.get())
        {
            if(geom.hasOwnProperty('tangents') && geom.tangents && geom.tangents.length>0) mesh.setAttribute('attrTangent',geom.tangents,3);
            if(geom.hasOwnProperty('biTangents') && geom.biTangents && geom.biTangents.length>0) mesh.setAttribute('attrBiTangent',geom.biTangents,3);

        }


    }
    else
    {
        mesh=null;
    }
}



};

Ops.Gl.RenderGeometry.prototype = new CABLES.Op();
CABLES.OPS["40fa6f13-ee0e-4386-a86b-711e1fbcf1bc"]={f:Ops.Gl.RenderGeometry,objName:"Ops.Gl.RenderGeometry"};




// **************************************************************
// 
// Ops.Gl.ShaderEffects.ExplodeDividedMesh
// 
// **************************************************************

Ops.Gl.ShaderEffects.ExplodeDividedMesh = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={explode_divided_mesh_vert:"UNI float MOD_dist;\n\nUNI float MOD_x;\nUNI float MOD_y;\nUNI float MOD_z;\n\nUNI float MOD_posx;\nUNI float MOD_posy;\nUNI float MOD_posz;\nUNI float MOD_size;\n\nUNI float MOD_mulx;\nUNI float MOD_muly;\nUNI float MOD_mulz;\n\nfloat MOD_rand(vec2 co)\n{\n    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n}\n\nvec4 MOD_deform(vec4 pos,vec3 normal,float index)\n{\n    index=floor(index/3.0);\n\n    vec4 p=abs(pos);\n    p.x+=MOD_x+0.01;\n    p.y+=MOD_y+0.01;\n    p.z+=MOD_z+0.01;\n    \n    vec4 pp=vec4(normal*(MOD_rand(vec2(index)) * MOD_dist-MOD_dist/2.0),1.0) * p;\n    \n    #ifdef ABSOLUTE\n        pp=abs(pp);\n    #endif\n\n    pp.x*=MOD_mulx;\n    pp.y*=MOD_muly;\n    pp.z*=MOD_mulz;\n    \n    \n    float MOD_falloff=0.2;\n    float distMul=distance(vec3(MOD_posx,MOD_posy,MOD_posz),pos.xyz);\n    distMul=1.0-smoothstep(MOD_falloff*MOD_size,MOD_size,distMul);\n\n    \n    \n    pos.xyz += distMul*pp.xyz;\n    \n    return pos;\n}\n",};

var cgl=op.patch.cgl;

op.render=op.addInPort(new CABLES.Port(this,"render",CABLES.OP_PORT_TYPE_FUNCTION));
op.trigger=op.addOutPort(new CABLES.Port(this,"trigger",CABLES.OP_PORT_TYPE_FUNCTION));

var inDistance=op.inValue("Distance",1);
var inAbsolute=op.inValueBool("Absolute",false);

{
    var x=op.inValue("add x");
    var y=op.inValue("add y");
    var z=op.inValue("add z");

    var mulx=op.inValue("mul x",1);
    var muly=op.inValue("mul y",1);
    var mulz=op.inValue("mul z",1);

    var posx=op.inValue("x");
    var posy=op.inValue("y");
    var posz=op.inValue("z");
}

var inSize=op.inValue("Size",1);

var shader=null;

var srcHeadVert=attachments.explode_divided_mesh_vert;

var srcBodyVert=''
    .endl()+'pos=MOD_deform(pos,attrVertNormal,attrVertIndex);'
    .endl();
    
var moduleVert=null;

function removeModule()
{
    if(shader && moduleVert) shader.removeModule(moduleVert);
    shader=null;
}

var absoluteChanged=false;

inAbsolute.onChange=function()
{
    absoluteChanged=true;
};

op.render.onLinkChanged=removeModule;

op.render.onTriggered=function()
{
    if(!cgl.getShader())
    {
         op.trigger.trigger();
         return;
    }

    if(CABLES.UI && gui.patch().isCurrentOp(op)) 
        gui.setTransformGizmo(
            {
                posX:posx,
                posY:posy,
                posZ:posz
            });

    if(cgl.getShader()!=shader)
    {
        if(shader) removeModule();
        shader=cgl.getShader();

        moduleVert=shader.addModule(
            {
                title:op.objName,
                name:'MODULE_VERTEX_POSITION',
                srcHeadVert:srcHeadVert,
                srcBodyVert:srcBodyVert
            });

        inDistance.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'dist',inDistance);

        x.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'x',x);
        y.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'y',y);
        z.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'z',z);

        mulx.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'mulx',mulx);
        muly.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'muly',muly);
        mulz.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'mulz',mulz);

        posx.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'posx',posx);
        posy.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'posy',posy);
        posz.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'posz',posz);

        inSize.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'size',inSize);
    }
    
    if(absoluteChanged)
    {
        absoluteChanged=false;
        if(inAbsolute.get()) shader.define("ABSOLUTE");
            else shader.removeDefine("ABSOLUTE");

    }
    
    if(!shader)return;

    op.trigger.trigger();
};















};

Ops.Gl.ShaderEffects.ExplodeDividedMesh.prototype = new CABLES.Op();
CABLES.OPS["b6d933cf-1ef8-41d6-95c1-593be0b4be90"]={f:Ops.Gl.ShaderEffects.ExplodeDividedMesh,objName:"Ops.Gl.ShaderEffects.ExplodeDividedMesh"};




// **************************************************************
// 
// Ops.Gl.ShaderEffects.MeshPixelNoise
// 
// **************************************************************

Ops.Gl.ShaderEffects.MeshPixelNoise = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={pixelnoise_frag:"IN vec4 MOD_pos;\n\nfloat MOD_mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}\nvec4 MOD_mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}\nvec4 MOD_perm(vec4 x){return MOD_mod289(((x * 34.0) + 1.0) * x);}\n\nfloat MOD_meshPixelNoise(vec3 p){\n    vec3 a = floor(p);\n    vec3 d = p - a;\n    d = d * d * (3.0 - 2.0 * d);\n\n    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);\n    vec4 k1 = MOD_perm(b.xyxy);\n    vec4 k2 = MOD_perm(k1.xyxy + b.zzww);\n\n    vec4 c = k2 + a.zzzz;\n    vec4 k3 = MOD_perm(c);\n    vec4 k4 = MOD_perm(c + 1.0);\n\n    vec4 o1 = fract(k3 * (1.0 / 41.0));\n    vec4 o2 = fract(k4 * (1.0 / 41.0));\n\n    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);\n    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);\n\n    return o4.y * d.y + o4.x * (1.0 - d.y);\n}\n",};
const
    render=op.inTrigger("render"),
    next=op.outTrigger("trigger"),
    inScale=op.inValue("Scale",10),
    inAmount=op.inValueSlider("Amount",0.3),
    inWorldSpace=op.inValueBool("WorldSpace");


const cgl=op.patch.cgl;
var shader=null;
var moduleFrag=null;
var moduleVert=null;
inWorldSpace.onChange=updateWorldspace;
render.onLinkChanged=removeModule;


var srcHeadVert=''
    .endl()+'OUT vec4 MOD_pos;'
    .endl();

var srcBodyVert=''
    .endl()+'#ifndef WORLDSPACE'
    .endl()+'   MOD_pos=pos;'
    .endl()+'#endif'
    .endl()+'#ifdef WORLDSPACE'
    .endl()+'   MOD_pos=pos*mMatrix;'
    .endl()+'#endif'
    .endl();

var srcHeadFrag=attachments.pixelnoise_frag
    .endl()+'UNI float MOD_scale;'
    .endl()+'UNI float MOD_amount;'
    .endl();

var srcBodyFrag=''
    .endl()+'col.rgb -= MOD_meshPixelNoise(MOD_pos.xyz*MOD_scale)*MOD_amount/4.0;'
    .endl();

function updateWorldspace()
{
    if(!shader)return;
    if(inWorldSpace.get()) shader.define("WORLDSPACE");
        else shader.removeDefine("WORLDSPACE");
}

function removeModule()
{
    if(shader && moduleFrag) shader.removeModule(moduleFrag);
    if(shader && moduleVert) shader.removeModule(moduleVert);
    shader=null;
}


render.onTriggered=function()
{
    if(!cgl.getShader())
    {
         next.trigger();
         return;
    }

    if(cgl.getShader()!=shader)
    {
        if(shader) removeModule();
        shader=cgl.getShader();

        moduleVert=shader.addModule(
            {
                title:op.objName,
                name:'MODULE_VERTEX_POSITION',
                srcHeadVert:srcHeadVert,
                srcBodyVert:srcBodyVert
            });

        moduleFrag=shader.addModule(
            {
                title:op.objName,
                name:'MODULE_COLOR',
                srcHeadFrag:srcHeadFrag,
                srcBodyFrag:srcBodyFrag
            },moduleVert);

        inScale.scale=new CGL.Uniform(shader,'f',moduleFrag.prefix+'scale',inScale);
        inAmount.amount=new CGL.Uniform(shader,'f',moduleFrag.prefix+'amount',inAmount);
        updateWorldspace();
    }

    if(!shader)return;

    next.trigger();
};


};

Ops.Gl.ShaderEffects.MeshPixelNoise.prototype = new CABLES.Op();
CABLES.OPS["3eeb7a13-339c-4409-9de7-3dfcab303663"]={f:Ops.Gl.ShaderEffects.MeshPixelNoise,objName:"Ops.Gl.ShaderEffects.MeshPixelNoise"};




// **************************************************************
// 
// Ops.Gl.ShaderEffects.PerlinAreaDeform2
// 
// **************************************************************

Ops.Gl.ShaderEffects.PerlinAreaDeform2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={perlindeform_vert:"\nUNI bool MOD_smooth;\nUNI float MOD_x,MOD_y,MOD_z;\nUNI float MOD_strength;\nUNI float MOD_size;\nUNI float MOD_scale;\nUNI float MOD_scrollx;\nUNI float MOD_scrolly;\nUNI float MOD_scrollz;\n\n\n\nfloat Interpolation_C2( float x ) { return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }   //  6x^5-15x^4+10x^3\t( Quintic Curve.  As used by Perlin in Improved Noise.  http://mrl.nyu.edu/~perlin/paper445.pdf )\nvec2 Interpolation_C2( vec2 x ) { return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }\nvec3 Interpolation_C2( vec3 x ) { return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }\nvec4 Interpolation_C2( vec4 x ) { return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }\nvec4 Interpolation_C2_InterpAndDeriv( vec2 x ) { return x.xyxy * x.xyxy * ( x.xyxy * ( x.xyxy * ( x.xyxy * vec2( 6.0, 0.0 ).xxyy + vec2( -15.0, 30.0 ).xxyy ) + vec2( 10.0, -60.0 ).xxyy ) + vec2( 0.0, 30.0 ).xxyy ); }\nvec3 Interpolation_C2_Deriv( vec3 x ) { return x * x * (x * (x * 30.0 - 60.0) + 30.0); }\n\n\nvoid FAST32_hash_3D( \tvec3 gridcell,\n                        out vec4 lowz_hash_0,\n                        out vec4 lowz_hash_1,\n                        out vec4 lowz_hash_2,\n                        out vec4 highz_hash_0,\n                        out vec4 highz_hash_1,\n                        out vec4 highz_hash_2\t)\t\t//\tgenerates 3 random numbers for each of the 8 cell corners\n{\n    //    gridcell is assumed to be an integer coordinate\n\n    //\tTODO: \tthese constants need tweaked to find the best possible noise.\n    //\t\t\tprobably requires some kind of brute force computational searching or something....\n    const vec2 OFFSET = vec2( 50.0, 161.0 );\n    const float DOMAIN = 69.0;\n    const vec3 SOMELARGEFLOATS = vec3( 635.298681, 682.357502, 668.926525 );\n    const vec3 ZINC = vec3( 48.500388, 65.294118, 63.934599 );\n\n    //\ttruncate the domain\n    gridcell.xyz = gridcell.xyz - floor(gridcell.xyz * ( 1.0 / DOMAIN )) * DOMAIN;\n    vec3 gridcell_inc1 = step( gridcell, vec3( DOMAIN - 1.5 ) ) * ( gridcell + 1.0 );\n\n    //\tcalculate the noise\n    vec4 P = vec4( gridcell.xy, gridcell_inc1.xy ) + OFFSET.xyxy;\n    P *= P;\n    P = P.xzxz * P.yyww;\n    vec3 lowz_mod = vec3( 1.0 / ( SOMELARGEFLOATS.xyz + gridcell.zzz * ZINC.xyz ) );\n    vec3 highz_mod = vec3( 1.0 / ( SOMELARGEFLOATS.xyz + gridcell_inc1.zzz * ZINC.xyz ) );\n    lowz_hash_0 = fract( P * lowz_mod.xxxx );\n    highz_hash_0 = fract( P * highz_mod.xxxx );\n    lowz_hash_1 = fract( P * lowz_mod.yyyy );\n    highz_hash_1 = fract( P * highz_mod.yyyy );\n    lowz_hash_2 = fract( P * lowz_mod.zzzz );\n    highz_hash_2 = fract( P * highz_mod.zzzz );\n}\n\n//\n//\tPerlin Noise 3D  ( gradient noise )\n//\tReturn value range of -1.0->1.0\n//\thttp://briansharpe.files.wordpress.com/2011/11/perlinsample.jpg\n//\nfloat Perlin3D( vec3 P )\n{\n    //\testablish our grid cell and unit position\n    vec3 Pi = floor(P);\n    vec3 Pf = P - Pi;\n    vec3 Pf_min1 = Pf - 1.0;\n\n#if 1\n    //\n    //\tclassic noise.\n    //\trequires 3 random values per point.  with an efficent hash function will run faster than improved noise\n    //\n\n    //\tcalculate the hash.\n    //\t( various hashing methods listed in order of speed )\n    vec4 hashx0, hashy0, hashz0, hashx1, hashy1, hashz1;\n    FAST32_hash_3D( Pi, hashx0, hashy0, hashz0, hashx1, hashy1, hashz1 );\n    //SGPP_hash_3D( Pi, hashx0, hashy0, hashz0, hashx1, hashy1, hashz1 );\n\n    //\tcalculate the gradients\n    vec4 grad_x0 = hashx0 - 0.49999;\n    vec4 grad_y0 = hashy0 - 0.49999;\n    vec4 grad_z0 = hashz0 - 0.49999;\n    vec4 grad_x1 = hashx1 - 0.49999;\n    vec4 grad_y1 = hashy1 - 0.49999;\n    vec4 grad_z1 = hashz1 - 0.49999;\n    vec4 grad_results_0 = inversesqrt( grad_x0 * grad_x0 + grad_y0 * grad_y0 + grad_z0 * grad_z0 ) * ( vec2( Pf.x, Pf_min1.x ).xyxy * grad_x0 + vec2( Pf.y, Pf_min1.y ).xxyy * grad_y0 + Pf.zzzz * grad_z0 );\n    vec4 grad_results_1 = inversesqrt( grad_x1 * grad_x1 + grad_y1 * grad_y1 + grad_z1 * grad_z1 ) * ( vec2( Pf.x, Pf_min1.x ).xyxy * grad_x1 + vec2( Pf.y, Pf_min1.y ).xxyy * grad_y1 + Pf_min1.zzzz * grad_z1 );\n\n#if 1\n    //\tClassic Perlin Interpolation\n    vec3 blend = Interpolation_C2( Pf );\n    vec4 res0 = mix( grad_results_0, grad_results_1, blend.z );\n    vec4 blend2 = vec4( blend.xy, vec2( 1.0 - blend.xy ) );\n    float final = dot( res0, blend2.zxzx * blend2.wwyy );\n    final *= 1.1547005383792515290182975610039;\t\t//\t(optionally) scale things to a strict -1.0->1.0 range    *= 1.0/sqrt(0.75)\n    return final;\n#else\n    //\tClassic Perlin Surflet\n    //\thttp://briansharpe.wordpress.com/2012/03/09/modifications-to-classic-perlin-noise/\n    Pf *= Pf;\n    Pf_min1 *= Pf_min1;\n    vec4 vecs_len_sq = vec4( Pf.x, Pf_min1.x, Pf.x, Pf_min1.x ) + vec4( Pf.yy, Pf_min1.yy );\n    float final = dot( Falloff_Xsq_C2( min( vec4( 1.0 ), vecs_len_sq + Pf.zzzz ) ), grad_results_0 ) + dot( Falloff_Xsq_C2( min( vec4( 1.0 ), vecs_len_sq + Pf_min1.zzzz ) ), grad_results_1 );\n    final *= 2.3703703703703703703703703703704;\t\t//\t(optionally) scale things to a strict -1.0->1.0 range    *= 1.0/cube(0.75)\n    return final;\n#endif\n\n#else\n    //\n    //\timproved noise.\n    //\trequires 1 random value per point.  Will run faster than classic noise if a slow hashing function is used\n    //\n\n    //\tcalculate the hash.\n    //\t( various hashing methods listed in order of speed )\n    vec4 hash_lowz, hash_highz;\n    FAST32_hash_3D( Pi, hash_lowz, hash_highz );\n    //BBS_hash_3D( Pi, hash_lowz, hash_highz );\n    //SGPP_hash_3D( Pi, hash_lowz, hash_highz );\n\n    //\n    //\t\"improved\" noise using 8 corner gradients.  Faster than the 12 mid-edge point method.\n    //\tKen mentions using diagonals like this can cause \"clumping\", but we'll live with that.\n    //\t[1,1,1]  [-1,1,1]  [1,-1,1]  [-1,-1,1]\n    //\t[1,1,-1] [-1,1,-1] [1,-1,-1] [-1,-1,-1]\n    //\n    hash_lowz -= 0.5;\n    vec4 grad_results_0_0 = vec2( Pf.x, Pf_min1.x ).xyxy * sign( hash_lowz );\n    hash_lowz = abs( hash_lowz ) - 0.25;\n    vec4 grad_results_0_1 = vec2( Pf.y, Pf_min1.y ).xxyy * sign( hash_lowz );\n    vec4 grad_results_0_2 = Pf.zzzz * sign( abs( hash_lowz ) - 0.125 );\n    vec4 grad_results_0 = grad_results_0_0 + grad_results_0_1 + grad_results_0_2;\n\n    hash_highz -= 0.5;\n    vec4 grad_results_1_0 = vec2( Pf.x, Pf_min1.x ).xyxy * sign( hash_highz );\n    hash_highz = abs( hash_highz ) - 0.25;\n    vec4 grad_results_1_1 = vec2( Pf.y, Pf_min1.y ).xxyy * sign( hash_highz );\n    vec4 grad_results_1_2 = Pf_min1.zzzz * sign( abs( hash_highz ) - 0.125 );\n    vec4 grad_results_1 = grad_results_1_0 + grad_results_1_1 + grad_results_1_2;\n\n    //\tblend the gradients and return\n    vec3 blend = Interpolation_C2( Pf );\n    vec4 res0 = mix( grad_results_0, grad_results_1, blend.z );\n    vec4 blend2 = vec4( blend.xy, vec2( 1.0 - blend.xy ) );\n    return dot( res0, blend2.zxzx * blend2.wwyy ) * (2.0 / 3.0);\t//\t(optionally) mult by (2.0/3.0) to scale to a strict -1.0->1.0 range\n#endif\n}\n\nvec3 MOD_deform(vec3 pos)\n{\n    // vec3 MOD_pos=vec3();\n    vec3 modelPos=pos;\n    vec3 forcePos=vec3(MOD_x,MOD_y,MOD_z);\n\n\n    vec3 vecToOrigin=modelPos-forcePos;\n    float dist=abs(length(vecToOrigin));\n    float distAlpha = (MOD_size - dist) / MOD_size;\n\n    if(MOD_smooth) distAlpha=smoothstep(0.0,MOD_size,distAlpha);\n\n\n    vec3 ppos=vec3(pos*MOD_scale);\n    ppos.x+=MOD_scrollx;\n    ppos.y+=MOD_scrolly;\n    ppos.z+=MOD_scrollz;\n\n    float p=Perlin3D(ppos)*MOD_strength*distAlpha;\n\n    vec3 pnorm=normalize(pos.xyz);\n\n    #ifdef MOD_METH_ADD_XYZ\n        pos.x+=p*pnorm.x;\n        pos.y+=p*pnorm.y;\n        pos.z+=p*pnorm.z;\n    #endif\n\n    #ifdef MOD_METH_ADD_Z\n        pos.z+=p;\n    #endif\n\n    return pos;\n}\n\n\nvec3 MOD_calcNormal(vec3 pos)\n{\n    float theta = .001;\n    vec3 vecTangent = normalize(cross(pos, vec3(1.0, 0.0, 0.0)) + cross(pos, vec3(0.0, 1.0, 0.0)));\n    vec3 vecBitangent = normalize(cross(vecTangent, pos));\n    vec3 ptTangentSample = MOD_deform(normalize(pos + theta * normalize(vecTangent)));\n    vec3 ptBitangentSample = MOD_deform(normalize(pos + theta * normalize(vecBitangent)));\n\n    return normalize(cross(ptTangentSample - pos, ptBitangentSample - pos));\n}\n",perlindeform_body_vert:"\n#ifndef MOD_WORLDSPACE\n   pos.xyz=MOD_deform(pos.xyz);\n   norm=MOD_calcNormal(pos.xyz);\n#endif\n\n#ifdef MOD_WORLDSPACE\n   pos.xyz=MOD_deform( (mMatrix*pos).xyz );\n   norm=MOD_calcNormal( (mMatrix*pos).xyz);\n#endif\n",};

var cgl=op.patch.cgl;

op.render=op.addInPort(new CABLES.Port(this,"render",CABLES.OP_PORT_TYPE_FUNCTION));
op.trigger=op.addOutPort(new CABLES.Port(this,"trigger",CABLES.OP_PORT_TYPE_FUNCTION));

var inScale=op.inValue("Scale",1);
var inSize=op.inValue("Size",1);
var inStrength=op.inValue("Strength",1);
var inSmooth=op.inValueBool("Smooth",true);

var output=op.inValueSelect("Output",['Add XYZ','Add Z'],'Add XYZ');

var x=op.inValue("x");
var y=op.inValue("y");
var z=op.inValue("z");



var scrollx=op.inValue("Scroll X");
var scrolly=op.inValue("Scroll Y");
var scrollz=op.inValue("Scroll Z");

var shader=null;

var inWorldSpace=op.inValueBool("WorldSpace");

var moduleVert=null;

function removeModule()
{
    if(shader && moduleVert) shader.removeModule(moduleVert);
    shader=null;
}

output.onChange=updateOutput;
op.render.onLinkChanged=removeModule;


inWorldSpace.onChange=updateWorldspace;

function updateOutput()
{
    if(!shader)return;
    if(output.get()=='Add XYZ') shader.define(moduleVert.prefix+"METH_ADD_XYZ");
        else shader.removeDefine(moduleVert.prefix+"METH_ADD_XYZ");

    if(output.get()=='Add Z') shader.define(moduleVert.prefix+"METH_ADD_Z");
        else shader.removeDefine(moduleVert.prefix+"METH_ADD_Z");

}

function updateWorldspace()
{
    if(!shader)return;
    if(inWorldSpace.get()) shader.define(moduleVert.prefix+"WORLDSPACE");
        else shader.removeDefine(moduleVert.prefix+"WORLDSPACE");
}


op.render.onTriggered=function()
{
    if(!cgl.getShader())
    {
        op.trigger.trigger();
        return;
    }

    if(CABLES.UI)
    {
        cgl.pushModelMatrix();
        mat4.identity(cgl.mvMatrix);

        if(CABLES.UI.renderHelper)
        {
            cgl.pushModelMatrix();
            mat4.translate(cgl.mvMatrix,cgl.mvMatrix,[x.get(),y.get(),z.get()]);
            CABLES.GL_MARKER.drawSphere(op,inSize.get());
            cgl.popModelMatrix();
        }


        if(gui.patch().isCurrentOp(op))
            gui.setTransformGizmo(
                {
                    posX:x,
                    posY:y,
                    posZ:z
                });


        cgl.popModelMatrix();
    }



    if(cgl.getShader()!=shader)
    {
        if(shader) removeModule();
        shader=cgl.getShader();

        moduleVert=shader.addModule(
            {
                title:op.objName,
                name:'MODULE_VERTEX_POSITION',
                srcHeadVert:attachments.perlindeform_vert,
                srcBodyVert:attachments.perlindeform_body_vert

            });

        inSize.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'size',inSize);
        inStrength.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'strength',inStrength);
        inSmooth.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'smooth',inSmooth);
        inScale.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'scale',inScale);

        scrollx.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'scrollx',scrollx);
        scrolly.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'scrolly',scrolly);
        scrollz.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'scrollz',scrollz);

        x.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'x',x);
        y.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'y',y);
        z.uniform=new CGL.Uniform(shader,'f',moduleVert.prefix+'z',z);

        updateOutput();
        updateWorldspace();
    }


    if(!shader)return;

    op.trigger.trigger();
};















};

Ops.Gl.ShaderEffects.PerlinAreaDeform2.prototype = new CABLES.Op();
CABLES.OPS["005fe510-e596-4985-bf17-e0c0950cea8a"]={f:Ops.Gl.ShaderEffects.PerlinAreaDeform2,objName:"Ops.Gl.ShaderEffects.PerlinAreaDeform2"};




// **************************************************************
// 
// Ops.Math.MapRange
// 
// **************************************************************

Ops.Math.MapRange = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};

const result=op.outValue("result");
var v=op.inValueFloat("value");
var old_min=op.inValueFloat("old min");
var old_max=op.inValueFloat("old max");
var new_min=op.inValueFloat("new min");
var new_max=op.inValueFloat("new max");
var easing=op.inValueSelect("Easing",["Linear","Smoothstep","Smootherstep"],"Linear");

op.setPortGroup("Input Range",[old_min,old_max]);
op.setPortGroup("Output Range",[new_min,new_max]);

var ease=0;
var r=0;

easing.onChange=function()
{
    if(easing.get()=="Smoothstep") ease=1;
        else if(easing.get()=="Smootherstep") ease=2;
            else ease=0;
};


function exec()
{
    if(v.get()>=Math.max( old_max.get(),old_min.get() ))
    {
        result.set(new_max.get());
        return;
    }
    else
    if(v.get()<=Math.min( old_max.get(),old_min.get() ))
    {
        result.set(new_min.get());
        return;
    }

    var nMin=new_min.get();
    var nMax=new_max.get();
    var oMin=old_min.get();
    var oMax=old_max.get();
    var x=v.get();

    var reverseInput = false;
    var oldMin = Math.min( oMin, oMax );
    var oldMax = Math.max( oMin, oMax );
    if(oldMin!= oMin) reverseInput = true;

    var reverseOutput = false;
    var newMin = Math.min( nMin, nMax );
    var newMax = Math.max( nMin, nMax );
    if(newMin != nMin) reverseOutput = true;

    var portion=0;

    if(reverseInput) portion = (oldMax-x)*(newMax-newMin)/(oldMax-oldMin);
        else portion = (x-oldMin)*(newMax-newMin)/(oldMax-oldMin);

    if(reverseOutput) r=newMax - portion;
        else r=portion + newMin;

    if(ease===0)
    {
        result.set(r);
    }
    else
    if(ease==1)
    {
        x = Math.max(0, Math.min(1, (r-nMin)/(nMax-nMin)));
        result.set( nMin+x*x*(3 - 2*x)* (nMax-nMin) ); // smoothstep
    }
    else
    if(ease==2)
    {
        x = Math.max(0, Math.min(1, (r-nMin)/(nMax-nMin)));
        result.set( nMin+x*x*x*(x*(x*6 - 15) + 10) * (nMax-nMin) ) ; // smootherstep
    }

}

v.set(0);
old_min.set(0);
old_max.set(1);
new_min.set(-1);
new_max.set(1);


v.onChange=exec;
old_min.onChange=exec;
old_max.onChange=exec;
new_min.onChange=exec;
new_max.onChange=exec;

result.set(0);

exec();

};

Ops.Math.MapRange.prototype = new CABLES.Op();
CABLES.OPS["2617b407-60a0-4ff6-b4a7-18136cfa7817"]={f:Ops.Math.MapRange,objName:"Ops.Math.MapRange"};




// **************************************************************
// 
// Ops.Value.Value
// 
// **************************************************************

Ops.Value.Value = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const v=op.inValueFloat("value");
const result=op.outValue("result");

v.onChange=exec;

function exec()
{
    result.set(parseFloat(v.get()));
}

};

Ops.Value.Value.prototype = new CABLES.Op();
CABLES.OPS["8fb2bb5d-665a-4d0a-8079-12710ae453be"]={f:Ops.Value.Value,objName:"Ops.Value.Value"};




// **************************************************************
// 
// Ops.Gl.Matrix.Transform
// 
// **************************************************************

Ops.Gl.Matrix.Transform = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    render=op.inTrigger("render"),
    posX=op.inValue("posX",0),
    posY=op.inValue("posY",0),
    posZ=op.inValue("posZ",0),
    scale=op.inValue("scale",1),
    rotX=op.inValue("rotX",0),
    rotY=op.inValue("rotY",0),
    rotZ=op.inValue("rotZ",0),
    trigger=op.outTrigger("trigger");

op.setPortGroup('Rotation',[rotX,rotY,rotZ]);
op.setPortGroup('Position',[posX,posY,posZ]);
op.setPortGroup('Scale',[scale]);
op.setUiAxisPorts(posX,posY,posZ);

const cgl=op.patch.cgl;
var vPos=vec3.create();
var vScale=vec3.create();
var transMatrix = mat4.create();
mat4.identity(transMatrix);

var
    doScale=false,
    doTranslate=false,
    translationChanged=true,
    scaleChanged=true,
    rotChanged=true;

rotX.onChange=rotY.onChange=rotZ.onChange=setRotChanged;
posX.onChange=posY.onChange=posZ.onChange=setTranslateChanged;
scale.onChange=setScaleChanged;

render.onTriggered=function()
{
    // if(!CGL.TextureEffect.checkOpNotInTextureEffect(op)) return;

    var updateMatrix=false;
    if(translationChanged)
    {
        updateTranslation();
        updateMatrix=true;
    }
    if(scaleChanged)
    {
        updateScale();
        updateMatrix=true;
    }
    if(rotChanged) updateMatrix=true;

    if(updateMatrix) doUpdateMatrix();

    cgl.pushModelMatrix();
    mat4.multiply(cgl.mMatrix,cgl.mMatrix,transMatrix);

    trigger.trigger();
    cgl.popModelMatrix();

    if(CABLES.UI && gui.patch().isCurrentOp(op))
        gui.setTransformGizmo(
            {
                posX:posX,
                posY:posY,
                posZ:posZ,
            });
};

op.transform3d=function()
{
    return { pos:[posX,posY,posZ] };
};

function doUpdateMatrix()
{
    mat4.identity(transMatrix);
    if(doTranslate)mat4.translate(transMatrix,transMatrix, vPos);

    if(rotX.get()!==0)mat4.rotateX(transMatrix,transMatrix, rotX.get()*CGL.DEG2RAD);
    if(rotY.get()!==0)mat4.rotateY(transMatrix,transMatrix, rotY.get()*CGL.DEG2RAD);
    if(rotZ.get()!==0)mat4.rotateZ(transMatrix,transMatrix, rotZ.get()*CGL.DEG2RAD);

    if(doScale)mat4.scale(transMatrix,transMatrix, vScale);
    rotChanged=false;
}

function updateTranslation()
{
    doTranslate=false;
    if(posX.get()!==0.0 || posY.get()!==0.0 || posZ.get()!==0.0) doTranslate=true;
    vec3.set(vPos, posX.get(),posY.get(),posZ.get());
    translationChanged=false;
}

function updateScale()
{
    // doScale=false;
    // if(scale.get()!==0.0)
    doScale=true;
    vec3.set(vScale, scale.get(),scale.get(),scale.get());
    scaleChanged=false;
}

function setTranslateChanged()
{
    translationChanged=true;
}

function setScaleChanged()
{
    scaleChanged=true;
}

function setRotChanged()
{
    rotChanged=true;
}

doUpdateMatrix();




};

Ops.Gl.Matrix.Transform.prototype = new CABLES.Op();
CABLES.OPS["650baeb1-db2d-4781-9af6-ab4e9d4277be"]={f:Ops.Gl.Matrix.Transform,objName:"Ops.Gl.Matrix.Transform"};




// **************************************************************
// 
// Ops.Math.Subtract
// 
// **************************************************************

Ops.Math.Subtract = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    number1=op.inValue("number1",1),
    number2=op.inValue("number2",1),
    result=op.outValue("result");

number1.onChange=exec;
number2.onChange=exec;
exec();

function exec()
{
    var v=number1.get()-number2.get();
    if(!isNaN(v)) result.set( v );
}



};

Ops.Math.Subtract.prototype = new CABLES.Op();
CABLES.OPS["a4ffe852-d200-4b96-9347-68feb01122ca"]={f:Ops.Math.Subtract,objName:"Ops.Math.Subtract"};




// **************************************************************
// 
// Ops.Gl.Shader.MatCapMaterialNew
// 
// **************************************************************

Ops.Gl.Shader.MatCapMaterialNew = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={matcap_frag:"\n{{MODULES_HEAD}}\n\nIN vec3 norm;\nIN vec2 texCoord;\nUNI sampler2D tex;\nIN vec2 vNorm;\nUNI mat4 viewMatrix;\n\nUNI float repeatX;\nUNI float repeatY;\nUNI float opacity;\n\nUNI float r;\nUNI float g;\nUNI float b;\n\nIN vec3 e;\n\n\n\n#ifdef HAS_DIFFUSE_TEXTURE\n   UNI sampler2D texDiffuse;\n#endif\n\n#ifdef USE_SPECULAR_TEXTURE\n   UNI sampler2D texSpec;\n   UNI sampler2D texSpecMatCap;\n#endif\n\n#ifdef HAS_AO_TEXTURE\n    UNI sampler2D texAo;\n    UNI float aoIntensity;\n#endif\n\n#ifdef HAS_NORMAL_TEXTURE\n   IN vec3 vBiTangent;\n   IN vec3 vTangent;\n\n   UNI sampler2D texNormal;\n   UNI mat4 normalMatrix;\n   \n   vec2 vNormt;\n#endif\n\n#ifdef CALC_SSNORMALS\n    // from https://www.enkisoftware.com/devlogpost-20150131-1-Normal_generation_in_the_pixel_shader\n    IN vec3 eye_relative_pos;\n#endif\n\n\nconst float normalScale=0.4;\n\nconst vec2 invAtan = vec2(0.1591, 0.3183);\nvec2 sampleSphericalMap(vec3 direction)\n{\n    vec2 uv = vec2(atan(direction.z, direction.x), asin(direction.y));\n    uv *= invAtan;\n    uv += 0.5;\n    return uv;\n}\n\n\nvoid main()\n{\n    vec2 vnOrig=vNorm;\n    vec2 vn=vNorm;\n\n\n\n    #ifdef HAS_TEXTURES\n        vec2 texCoords=texCoord;\n        {{MODULE_BEGIN_FRAG}}\n    #endif\n\n    #ifdef CALC_SSNORMALS\n    \tvec3 dFdxPos = dFdx( eye_relative_pos );\n    \tvec3 dFdyPos = dFdy( eye_relative_pos );\n    \tvec3 ssn = normalize( cross(dFdxPos,dFdyPos ));\n    \t\n        vec3 rr = reflect( e, ssn );\n        float ssm = 2. * sqrt( \n            pow(rr.x, 2.0)+\n            pow(rr.y, 2.0)+\n            pow(rr.z + 1.0, 2.0)\n        );\n\n\n        vn = (rr.xy / ssm + 0.5);\n        \n        vn.t=clamp(vn.t, 0.0, 1.0);\n        vn.s=clamp(vn.s, 0.0, 1.0);\n        \n        // float dst = dot(abs(coord-center), vec2(1.0));\n        // float aaf = fwidth(dst);\n        // float alpha = smoothstep(radius - aaf, radius, dst);\n\n    #endif\n\n   #ifdef HAS_NORMAL_TEXTURE\n        vec3 tnorm=texture( texNormal, vec2(texCoord.x*repeatX,texCoord.y*repeatY) ).xyz * 2.0 - 1.0;\n        \n        tnorm = normalize(tnorm*normalScale);\n        \n        vec3 tangent;\n        vec3 binormal;\n        \n        #ifdef CALC_TANGENT\n            vec3 c1 = cross(norm, vec3(0.0, 0.0, 1.0));\n//            vec3 c2 = cross(norm, vec3(0.0, 1.0, 0.0));\n//            if(length(c1)>length(c2)) tangent = c2;\n//                else tangent = c1;\n            tangent = c1;\n            tangent = normalize(tangent);\n            binormal = cross(norm, tangent);\n            binormal = normalize(binormal);\n        #endif\n\n        #ifndef CALC_TANGENT\n            tangent=normalize(vTangent);\n//            tangent.y*=-13.0;\n//            binormal=vBiTangent*norm;\n//            binormal.z*=-1.0;\n//            binormal=normalize(binormal);\n            binormal=normalize( cross( normalize(norm), normalize(vBiTangent) ));\n        // vBinormal = normalize( cross( vNormal, vTangent ) * tangent.w );\n\n        #endif\n\n        tnorm=normalize(tangent*tnorm.x + binormal*tnorm.y + norm*tnorm.z);\n\n        // vec3 n = normalize( mat3(normalMatrix) * (norm+tnorm*normalScale) );\n        vec3 n = normalize( mat3(normalMatrix) * (norm+tnorm*normalScale) );\n\n        vec3 re = reflect( e, n );\n        float m = 2. * sqrt( \n            pow(re.x, 2.0)+\n            pow(re.y, 2.0)+\n            pow(re.z + 1.0, 2.0)\n        );\n        \n        vn = (re.xy / m + 0.5);\n        \n    #endif\n\n    vn.t=clamp(vn.t, 0.0, 1.0);\n    vn.s=clamp(vn.s, 0.0, 1.0);\n    \n    \n    vec4 col = texture( tex, vn );\n\n    #ifdef HAS_DIFFUSE_TEXTURE\n        col = col*texture( texDiffuse, vec2(texCoords.x*repeatX,texCoords.y*repeatY));\n    #endif\n\n    col.r*=r;\n    col.g*=g;\n    col.b*=b;\n\n\n    #ifdef HAS_AO_TEXTURE\n        col = col*\n            mix(\n                vec4(1.0,1.0,1.0,1.0),\n                texture( texAo, vec2(texCoords.x*repeatX,texCoords.y*repeatY)),\n                aoIntensity\n                );\n    #endif\n\n    #ifdef USE_SPECULAR_TEXTURE\n        vec4 spec = texture( texSpecMatCap, vn );\n        spec*= texture( texSpec, vec2(texCoords.x*repeatX,texCoords.y*repeatY) );\n        col+=spec;\n    #endif\n\n    col.a*=opacity;\n\n    {{MODULE_COLOR}}\n\n    outColor = col;\n\n}",matcap_vert:"\nIN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN vec3 attrVertNormal;\nIN float attrVertIndex;\n\n#ifdef HAS_NORMAL_TEXTURE\n   IN vec3 attrTangent;\n   IN vec3 attrBiTangent;\n\n   OUT vec3 vBiTangent;\n   OUT vec3 vTangent;\n#endif\n\nOUT vec2 texCoord;\nOUT vec3 norm;\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\n\nOUT vec2 vNorm;\nOUT vec3 e;\n\n#ifndef INSTANCING\n    UNI mat4 normalMatrix;\n#endif\n\n\n{{MODULES_HEAD}}\n\n#ifdef CALC_SSNORMALS\n    // from https://www.enkisoftware.com/devlogpost-20150131-1-Normal_generation_in_the_pixel_shader\n    OUT vec3 eye_relative_pos;\n    UNI vec3 camPos;\n#endif\n\n\n\nvoid main()\n{\n    texCoord=attrTexCoord;\n    norm=attrVertNormal;\n    mat4 mMatrix=modelMatrix;\n    mat4 mvMatrix;\n\n    #ifdef HAS_NORMAL_TEXTURE\n        vTangent=attrTangent;\n        vBiTangent=attrBiTangent;\n    #endif\n\n    vec4 pos = vec4( vPosition, 1. );\n\n    {{MODULE_VERTEX_POSITION}}\n\n\n    mvMatrix= viewMatrix * mMatrix;\n\n    #ifdef INSTANCING\n        mat4 normalMatrix=mvMatrix;//inverse(transpose(mvMatrix));\n    #endif\n\n    e = normalize( vec3( mvMatrix * pos ) );\n    vec3 n = normalize( mat3(normalMatrix) * norm );\n\n\n    // mat3 nMatrix = transpose(inverse(mat3(mMatrix)));\n    // vec3 n = normalize( mat3(nMatrix) * norm );\n    // norm=n;\n\n    vec3 r = reflect( e, n );\n\n\n\n\n    float m = 2. * sqrt(\n        pow(r.x, 2.0)+\n        pow(r.y, 2.0)+\n        pow(r.z + 1.0, 2.0)\n    );\n    vNorm = r.xy / m + 0.5;\n\n    #ifdef DO_PROJECT_COORDS_XY\n       texCoord=(projMatrix * mvMatrix*pos).xy*0.1;\n    #endif\n\n    #ifdef DO_PROJECT_COORDS_YZ\n       texCoord=(projMatrix * mvMatrix*pos).yz*0.1;\n    #endif\n\n    #ifdef DO_PROJECT_COORDS_XZ\n        texCoord=(projMatrix * mvMatrix*pos).xz*0.1;\n    #endif\n\n    #ifdef CALC_SSNORMALS\n        eye_relative_pos = (mvMatrix * pos ).xyz - camPos;\n    #endif\n\n\n\n   gl_Position = projMatrix * mvMatrix * pos;\n\n}",};
const render=op.inTrigger("render");
const textureMatcap=op.inTexture('MatCap');
const textureDiffuse=op.inTexture('Diffuse');
const textureNormal=op.inTexture('Normal');
const textureSpec=op.inTexture('Specular');
const textureSpecMatCap=op.inTexture('Specular MatCap');
const textureAo=op.inTexture('AO Texture');
const r=op.inValueSlider('r',1);
const g=op.inValueSlider('g',1);
const b=op.inValueSlider('b',1);
const pOpacity=op.inValueSlider("Opacity",1);
const aoIntensity=op.inValueSlider("AO Intensity",1.0);
const repeatX=op.inValue("Repeat X",1);
const repeatY=op.inValue("Repeat Y",1);
const calcTangents = op.inValueBool("calc normal tangents",true);
const projectCoords=op.inValueSelect('projectCoords',['no','xy','yz','xz'],'no');
const ssNormals=op.inValueBool("Screen Space Normals");
const next=op.outTrigger("trigger");
const shaderOut=op.outObject("Shader");

r.setUiAttribs({colorPick:true});
op.setPortGroup("Texture maps",[textureDiffuse,textureNormal,textureSpec,textureSpecMatCap,textureAo,]);
op.setPortGroup("Color",[r,g,b,pOpacity]);

const cgl=op.patch.cgl;
const shader=new CGL.Shader(cgl,'MatCapMaterialNew');
var uniOpacity=new CGL.Uniform(shader,'f','opacity',pOpacity);

shader.setModules(['MODULE_VERTEX_POSITION','MODULE_COLOR','MODULE_BEGIN_FRAG']);
shader.bindTextures=bindTextures;
shader.setSource(attachments.matcap_vert,attachments.matcap_frag);
shaderOut.set(shader);

var textureMatcapUniform=null;
var textureDiffuseUniform=null;
var textureNormalUniform=null;
var textureSpecUniform=null;
var textureSpecMatCapUniform=null;
var textureAoUniform=null;
var repeatXUniform=new CGL.Uniform(shader,'f','repeatX',repeatX);
var repeatYUniform=new CGL.Uniform(shader,'f','repeatY',repeatY);
var aoIntensityUniform=new CGL.Uniform(shader,'f','aoIntensity',aoIntensity);
b.uniform=new CGL.Uniform(shader,'f','b',b);
g.uniform=new CGL.Uniform(shader,'f','g',g);
r.uniform=new CGL.Uniform(shader,'f','r',r);


calcTangents.onChange=updateDefines;
updateDefines();
updateMatcap();

function updateDefines()
{
    if(calcTangents.get()) shader.define('CALC_TANGENT');
        else shader.removeDefine('CALC_TANGENT');

}

ssNormals.onChange=function()
{
    if(ssNormals.get())
    {
        if(cgl.glVersion<2)
        {
            cgl.gl.getExtension('OES_standard_derivatives');
            shader.enableExtension('GL_OES_standard_derivatives');
        }

        shader.define('CALC_SSNORMALS');
    }
    else shader.removeDefine('CALC_SSNORMALS');
};

projectCoords.onChange=function()
{
    shader.removeDefine('DO_PROJECT_COORDS_XY');
    shader.removeDefine('DO_PROJECT_COORDS_YZ');
    shader.removeDefine('DO_PROJECT_COORDS_XZ');

    if(projectCoords.get()=='xy') shader.define('DO_PROJECT_COORDS_XY');
    else if(projectCoords.get()=='yz') shader.define('DO_PROJECT_COORDS_YZ');
    else if(projectCoords.get()=='xz') shader.define('DO_PROJECT_COORDS_XZ');
};

textureMatcap.onChange=updateMatcap;

function updateMatcap()
{
    if(textureMatcap.get())
    {
        if(textureMatcapUniform!==null)return;
        shader.removeUniform('tex');
        textureMatcapUniform=new CGL.Uniform(shader,'t','tex',0);
    }
    else
    {
        if(!CGL.defaultTextureMap)
        {
            var pixels=new Uint8Array(256*4);
            for(var x=0;x<16;x++)
            {
                for(var y=0;y<16;y++)
                {
                    var c=y*16;
                    c*=Math.min(1,(x+y/3)/8);
                    pixels[(x+y*16)*4+0]=pixels[(x+y*16)*4+1]=pixels[(x+y*16)*4+2]=c;
                    pixels[(x+y*16)*4+3]=255;
                }
            }

            CGL.defaultTextureMap=new CGL.Texture(cgl);
            CGL.defaultTextureMap.initFromData(pixels,16,16);
        }
        textureMatcap.set(CGL.defaultTextureMap);

        shader.removeUniform('tex');
        textureMatcapUniform=new CGL.Uniform(shader,'t','tex',0);
    }
}

textureDiffuse.onChange=function()
{
    if(textureDiffuse.get())
    {
        if(textureDiffuseUniform!==null)return;
        shader.define('HAS_DIFFUSE_TEXTURE');
        shader.removeUniform('texDiffuse');
        textureDiffuseUniform=new CGL.Uniform(shader,'t','texDiffuse',1);
    }
    else
    {
        shader.removeDefine('HAS_DIFFUSE_TEXTURE');
        shader.removeUniform('texDiffuse');
        textureDiffuseUniform=null;
    }
};

textureNormal.onChange=function()
{
    if(textureNormal.get())
    {
        if(textureNormalUniform!==null)return;
        shader.define('HAS_NORMAL_TEXTURE');
        shader.removeUniform('texNormal');
        textureNormalUniform=new CGL.Uniform(shader,'t','texNormal',2);
    }
    else
    {
        shader.removeDefine('HAS_NORMAL_TEXTURE');
        shader.removeUniform('texNormal');
        textureNormalUniform=null;
    }
};

textureAo.onChange=function()
{
    if(textureAo.get())
    {
        if(textureAoUniform!==null)return;
        shader.define('HAS_AO_TEXTURE');
        shader.removeUniform('texAo');
        textureAoUniform=new CGL.Uniform(shader,'t','texAo',5);
    }
    else
    {
        shader.removeDefine('HAS_AO_TEXTURE');
        shader.removeUniform('texAo');
        textureAoUniform=null;
    }
};

textureSpec.onChange=textureSpecMatCap.onChange=function()
{
    if(textureSpec.get() && textureSpecMatCap.get())
    {
        if(textureSpecUniform!==null)return;
        shader.define('USE_SPECULAR_TEXTURE');
        shader.removeUniform('texSpec');
        shader.removeUniform('texSpecMatCap');
        textureSpecUniform=new CGL.Uniform(shader,'t','texSpec',3);
        textureSpecMatCapUniform=new CGL.Uniform(shader,'t','texSpecMatCap',4);
    }
    else
    {
        shader.removeDefine('USE_SPECULAR_TEXTURE');
        shader.removeUniform('texSpec');
        shader.removeUniform('texSpecMatCap');
        textureSpecUniform=null;
        textureSpecMatCapUniform=null;
    }
};

function bindTextures()
{
    if(textureMatcap.get())     cgl.setTexture(0,textureMatcap.get().tex);
    if(textureDiffuse.get())    cgl.setTexture(1,textureDiffuse.get().tex);
    if(textureNormal.get())     cgl.setTexture(2,textureNormal.get().tex);
    if(textureSpec.get())       cgl.setTexture(3,textureSpec.get().tex);
    if(textureSpecMatCap.get()) cgl.setTexture(4,textureSpecMatCap.get().tex);
    if(textureAo.get())         cgl.setTexture(5,textureAo.get().tex);
};

op.onDelete=function()
{
    if(CGL.defaultTextureMap)
    {
        CGL.defaultTextureMap.delete();
        CGL.defaultTextureMap=null;
    }
};

op.preRender=function()
{
    shader.bind();
};

render.onTriggered=function()
{
    shader.bindTextures=bindTextures;
    cgl.setShader(shader);
    next.trigger();
    cgl.setPreviousShader();
};



};

Ops.Gl.Shader.MatCapMaterialNew.prototype = new CABLES.Op();
CABLES.OPS["7857ee9e-6d60-4c30-9bc0-dfdddf2b47ad"]={f:Ops.Gl.Shader.MatCapMaterialNew,objName:"Ops.Gl.Shader.MatCapMaterialNew"};




// **************************************************************
// 
// Ops.Array.ArrayGetObject
// 
// **************************************************************

Ops.Array.ArrayGetObject = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    array=op.inArray("array"),
    index=op.inValueInt("index"),
    value=op.outObject("value");

var last=null;

array.ignoreValueSerialize=true;
value.ignoreValueSerialize=true;

index.onChange=update;
array.onChange=update;

op.toWorkPortsNeedToBeLinked(array,value);

function update()
{
    if(index.get()<0)
    {
        value.set( null);
        return;
    }

    var arr=array.get();
    if(!arr)
    {
        value.set( null);
        return;
    }

    var ind=index.get();
    if(ind>=arr.length)
    {
        value.set( null);
        return;
    }
    if(arr[ind])
    {
        value.set( arr[ind]);
        last=arr[ind];
    }
}



};

Ops.Array.ArrayGetObject.prototype = new CABLES.Op();
CABLES.OPS["44d34542-174c-47c6-b9c6-adde6fc371ac"]={f:Ops.Array.ArrayGetObject,objName:"Ops.Array.ArrayGetObject"};




// **************************************************************
// 
// Ops.Gl.TextureArray
// 
// **************************************************************

Ops.Gl.TextureArray = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var outArr=op.outArray("Array");
var outCount=op.outValue("Count");
outArr.ignoreValueSerialize=true;

const num=15;
var texturePorts=[];
var arr=[];

function rebuild()
{
    var i=0;
    var count=0;
    for(i=0;i<texturePorts.length;i++) if(texturePorts[i].isLinked()) count++;

    arr.length=count;

    count=0;
    for(i=0;i<texturePorts.length;i++)
    {
        if(texturePorts[i].isLinked())
        {
            arr[count]=texturePorts[i].get();
            count++;
        }
    }

    outArr.set(null);
    outArr.set(arr);
    outCount.set(count);
}

for(var i=0;i<num;i++)
{
    var p=op.inTexture("Texture "+i);
    p.onLinkChanged=rebuild;
    p.onChange=rebuild;
    texturePorts.push(p);
}


};

Ops.Gl.TextureArray.prototype = new CABLES.Op();
CABLES.OPS["fac012e2-43c8-4e21-85ac-189fe85d5723"]={f:Ops.Gl.TextureArray,objName:"Ops.Gl.TextureArray"};




// **************************************************************
// 
// Ops.Sequence
// 
// **************************************************************

Ops.Sequence = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const exe=op.inTrigger("exe");
const exes=[];
const triggers=[];
const num=16;
exe.onTriggered=triggerAll;

function triggerAll()
{
    for(var i=0;i<triggers.length;i++) triggers[i].trigger();
}

for(var i=0;i<num;i++)
{
    triggers.push( op.addOutPort(new CABLES.Port(op,"trigger "+i,CABLES.OP_PORT_TYPE_FUNCTION)) );
    
    if(i<num-1)
    {
        var newExe=op.addInPort(new CABLES.Port(op,"exe "+i,CABLES.OP_PORT_TYPE_FUNCTION));
        newExe.onTriggered=triggerAll;
        exes.push( newExe );
    }
}


};

Ops.Sequence.prototype = new CABLES.Op();
CABLES.OPS["a466bc1f-06e9-4595-8849-bffb9fe22f99"]={f:Ops.Sequence,objName:"Ops.Sequence"};




// **************************************************************
// 
// Ops.Gl.Texture
// 
// **************************************************************

Ops.Gl.Texture = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var filename=op.inFile("file");
var tfilter=op.inValueSelect("filter",['nearest','linear','mipmap']);
var wrap=op.inValueSelect("wrap",['repeat','mirrored repeat','clamp to edge'],"clamp to edge");
var flip=op.inValueBool("flip",false);
var unpackAlpha=op.inValueBool("unpackPreMultipliedAlpha",false);

var textureOut=op.outTexture("texture");
var width=op.outValue("width");
var height=op.outValue("height");
var loading=op.outValue("loading");
var ratio=op.outValue("Aspect Ratio");

unpackAlpha.hidePort();

const cgl=op.patch.cgl;
var cgl_filter=0;
var cgl_wrap=0;

filename.onChange=flip.onChange=function(){reloadSoon();};

tfilter.onChange=onFilterChange;
wrap.onChange=onWrapChange;
unpackAlpha.onChange=function(){ reloadSoon(); };

var timedLoader=0;

tfilter.set('mipmap');
wrap.set('repeat');

textureOut.set(CGL.Texture.getEmptyTexture(cgl));

var setTempTexture=function()
{
    var t=CGL.Texture.getTempTexture(cgl);
    textureOut.set(t);
};

var loadingId=null;
var tex=null;
function reloadSoon(nocache)
{
    // if(!loadingId)loadingId=cgl.patch.loading.start('textureOp',filename.get());

    // if(timedLoader!=0)
    // {
    //     console.log('tex load canceled...');
    // }
    clearTimeout(timedLoader);
    timedLoader=setTimeout(function()
    {
        // console.log('tex load yay...');
        realReload(nocache);
    },30);
}

function realReload(nocache)
{
    if(!loadingId)loadingId=cgl.patch.loading.start('textureOp',filename.get());

    var url=op.patch.getFilePath(String(filename.get()));
    if(nocache)url+='?rnd='+CABLES.generateUUID();

    if((filename.get() && filename.get().length>1))
    {
        loading.set(true);

        if(tex)tex.delete();
        tex=CGL.Texture.load(cgl,url,
            function(err)
            {
                if(err)
                {
                    setTempTexture();
                    op.uiAttr({'error':'could not load texture "'+filename.get()+'"'});
                    cgl.patch.loading.finished(loadingId);
                    return;
                }
                else op.uiAttr({'error':null});
                textureOut.set(tex);
                width.set(tex.width);
                height.set(tex.height);
                ratio.set(tex.width/tex.height);

                if(!tex.isPowerOfTwo()) op.uiAttr(
                    {
                        hint:'texture dimensions not power of two! - texture filtering will not work.',
                        warning:null
                    });
                    else op.uiAttr(
                        {
                            hint:null,
                            warning:null
                        });

                textureOut.set(null);
                textureOut.set(tex);
                // tex.printInfo();

            },{
                wrap:cgl_wrap,
                flip:flip.get(),
                unpackAlpha:unpackAlpha.get(),
                filter:cgl_filter
            });

        textureOut.set(null);
        textureOut.set(tex);

        if(!textureOut.get() && nocache)
        {
        }

        cgl.patch.loading.finished(loadingId);
    }
    else
    {
        cgl.patch.loading.finished(loadingId);
        setTempTexture();
    }
}


function onFilterChange()
{
    if(tfilter.get()=='nearest') cgl_filter=CGL.Texture.FILTER_NEAREST;
    if(tfilter.get()=='linear') cgl_filter=CGL.Texture.FILTER_LINEAR;
    if(tfilter.get()=='mipmap') cgl_filter=CGL.Texture.FILTER_MIPMAP;

    reloadSoon();
}

function onWrapChange()
{
    if(wrap.get()=='repeat') cgl_wrap=CGL.Texture.WRAP_REPEAT;
    if(wrap.get()=='mirrored repeat') cgl_wrap=CGL.Texture.WRAP_MIRRORED_REPEAT;
    if(wrap.get()=='clamp to edge') cgl_wrap=CGL.Texture.WRAP_CLAMP_TO_EDGE;

    reloadSoon();
}

op.onFileChanged=function(fn)
{
    console.log(fn);
    if(filename.get() && filename.get().indexOf(fn)>-1)
    {
        textureOut.set(null);
        textureOut.set(CGL.Texture.getTempTexture(cgl));

        realReload(true);
    }
};







};

Ops.Gl.Texture.prototype = new CABLES.Op();
CABLES.OPS["466394d4-6c1a-4e5d-a057-0063ab0f096a"]={f:Ops.Gl.Texture,objName:"Ops.Gl.Texture"};




// **************************************************************
// 
// Ops.Gl.Meshes.Rectangle
// 
// **************************************************************

Ops.Gl.Meshes.Rectangle = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var render=op.inTrigger("render");
var trigger=op.outTrigger('trigger');

var width=op.inValue("width",1);
var height=op.inValue("height",1);

var pivotX=op.inValueSelect("pivot x",["center","left","right"]);
var pivotY=op.inValueSelect("pivot y",["center","top","bottom"]);

var nColumns=op.inValueInt("num columns",1);
var nRows=op.inValueInt("num rows",1);
var axis=op.inValueSelect("axis",["xy","xz"],"xy");

var active=op.inValueBool('Active',true);

var geomOut=op.outObject("geometry");
geomOut.ignoreValueSerialize=true;

var cgl=op.patch.cgl;
axis.set('xy');
pivotX.set('center');
pivotY.set('center');

op.setPortGroup('Pivot',[pivotX,pivotY]);
op.setPortGroup('Size',[width,height]);
op.setPortGroup('Structure',[nColumns,nRows]);

var geom=new CGL.Geometry('rectangle');
var mesh=null;

axis.onChange=rebuild;
pivotX.onChange=rebuild;
pivotY.onChange=rebuild;
width.onChange=rebuild;
height.onChange=rebuild;
nRows.onChange=rebuild;
nColumns.onChange=rebuild;
rebuild();

render.onTriggered=function()
{
    if(!CGL.TextureEffect.checkOpNotInTextureEffect(op)) return;


    if(active.get() && mesh) mesh.render(cgl.getShader());
    trigger.trigger();
};

function rebuild()
{
    var w=width.get();
    var h=height.get();
    var x=0;
    var y=0;

    if(typeof w=='string')w=parseFloat(w);
    if(typeof h=='string')h=parseFloat(h);

    if(pivotX.get()=='center') x=0;
    else if(pivotX.get()=='right') x=-w/2;
    else if(pivotX.get()=='left') x=+w/2;

    if(pivotY.get()=='center') y=0;
    else if(pivotY.get()=='top') y=-h/2;
    else if(pivotY.get()=='bottom') y=+h/2;

    var verts=[];
    var tc=[];
    var norms=[];
    var tangents=[];
    var biTangents=[];
    var indices=[];

    var numRows=Math.round(nRows.get());
    var numColumns=Math.round(nColumns.get());

    var stepColumn=w/numColumns;
    var stepRow=h/numRows;

    var c,r,a;
    a=axis.get();
    for(r=0;r<=numRows;r++)
    {
        for(c=0;c<=numColumns;c++)
        {
            verts.push( c*stepColumn - width.get()/2+x );
            if(a=='xz') verts.push( 0.0 );
            verts.push( r*stepRow - height.get()/2+y );
            if(a=='xy') verts.push( 0.0 );

            tc.push( c/numColumns );
            tc.push( 1.0-r/numRows );

            if(a=='xz')
            {
                norms.push(0,1,0);
                tangents.push(1,0,0);
                biTangents.push(0,0,1);
            }
            else if(a=='xy')
            {
                norms.push(0,0,1);
                tangents.push(-1,0,0);
                biTangents.push(0,-1,0);
            }
        }
    }

    for(c=0;c<numColumns;c++)
    {
        for(r=0;r<numRows;r++)
        {
            var ind = c+(numColumns+1)*r;
            var v1=ind;
            var v2=ind+1;
            var v3=ind+numColumns+1;
            var v4=ind+1+numColumns+1;

            indices.push(v1);
            indices.push(v3);
            indices.push(v2);

            indices.push(v2);
            indices.push(v3);
            indices.push(v4);
        }
    }

    geom.clear();
    geom.vertices=verts;
    geom.texCoords=tc;
    geom.verticesIndices=indices;
    geom.vertexNormals=norms;
    geom.tangents=tangents;
    geom.biTangents=biTangents;

    if(numColumns*numRows>64000)geom.unIndex();

    if(!mesh) mesh=new CGL.Mesh(cgl,geom);
        else mesh.setGeom(geom);

    geomOut.set(null);
    geomOut.set(geom);

}

op.onDelete=function()
{
    if(mesh)mesh.dispose();
}

};

Ops.Gl.Meshes.Rectangle.prototype = new CABLES.Op();
CABLES.OPS["20f3c4e7-04d1-44e0-b868-05756d1c66c6"]={f:Ops.Gl.Meshes.Rectangle,objName:"Ops.Gl.Meshes.Rectangle"};




// **************************************************************
// 
// Ops.Gl.FaceCulling
// 
// **************************************************************

Ops.Gl.FaceCulling = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    render=op.inTrigger("render"),
    trigger=op.outTrigger("trigger"),
    enable=op.inValueBool("enable",true),
    facing=op.inValueSelect("facing",['back','front','both'],'back'),
    cgl=op.patch.cgl;

var whichFace=cgl.gl.BACK;

render.onTriggered=function()
{
    if(enable.get()) cgl.gl.enable(cgl.gl.CULL_FACE);
        else cgl.gl.disable(cgl.gl.CULL_FACE);

    cgl.gl.cullFace(whichFace);
    trigger.trigger();
    cgl.gl.disable(cgl.gl.CULL_FACE);
};

facing.onChange=function()
{
    whichFace=cgl.gl.BACK;
    if(facing.get()=='front') whichFace=cgl.gl.FRONT;
        else if(facing.get()=='both') whichFace=cgl.gl.FRONT_AND_BACK;
};

};

Ops.Gl.FaceCulling.prototype = new CABLES.Op();
CABLES.OPS["a389f42c-7324-45c9-bb47-369e31d602f0"]={f:Ops.Gl.FaceCulling,objName:"Ops.Gl.FaceCulling"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.ChromaticAberration
// 
// **************************************************************

Ops.Gl.TextureEffects.ChromaticAberration = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={chromatic_frag:"\nIN vec2 texCoord;\nUNI sampler2D tex;\nUNI float pixel;\nUNI float onePixel;\nUNI float amount;\nUNI float lensDistort;\n\n#ifdef MASK\nUNI sampler2D texMask;\n#endif\n\n{{CGL.BLENDMODES}}\n\nvoid main()\n{\n   vec4 base=texture(tex,texCoord);\n   vec4 col=texture(tex,texCoord);\n\n   vec2 tc=texCoord;;\n   float pix = pixel;\n   if(lensDistort>0.0)\n   {\n       float dist = distance(texCoord, vec2(0.5,0.5));\n       tc-=0.5;\n       tc *=smoothstep(-0.9,1.0*lensDistort,1.0-dist);\n       tc+=0.5;\n   }\n\n    #ifdef MASK\n        vec4 m=texture(texMask,texCoord);\n        pix*=m.r*m.a;\n    #endif\n\n    #ifdef SMOOTH\n    #ifdef WEBGL2\n        float numSamples=round(pix/onePixel/4.0+1.0);\n        col.r=0.0;\n        col.b=0.0;\n\n        for(float off=0.0;off<numSamples;off++)\n        {\n            float diff=(pix/numSamples)*off;\n            col.r+=texture(tex,vec2(tc.x+diff,tc.y)).r/numSamples;\n            col.b+=texture(tex,vec2(tc.x-diff,tc.y)).b/numSamples;\n        }\n    #endif\n    #endif\n\n    #ifndef SMOOTH\n        col.r=texture(tex,vec2(tc.x+pix,tc.y)).r;\n        col.b=texture(tex,vec2(tc.x-pix,tc.y)).b;\n    #endif\n\n//   outColor = col;\n   outColor= cgl_blend(base,col,amount);\n\n}\n",};
const
    render=op.inTrigger('render'),
    blendMode=CGL.TextureEffect.AddBlendSelect(op,"Blend Mode","normal"),
    amount=op.inValueSlider("Amount",1),
    pixel=op.inValue("Pixel",5),
    lensDistort=op.inValueSlider("Lens Distort",0),
    doSmooth=op.inValueBool("Smooth",false),
    textureMask=op.inTexture("Mask"),
    trigger=op.outTrigger('trigger');

const cgl=op.patch.cgl;
const shader=new CGL.Shader(cgl);

CGL.TextureEffect.setupBlending(op,shader,blendMode,amount);

shader.setSource(shader.getDefaultVertexShader(),attachments.chromatic_frag);
const textureUniform=new CGL.Uniform(shader,'t','tex',0),
    uniPixel=new CGL.Uniform(shader,'f','pixel',0),
    uniOnePixel=new CGL.Uniform(shader,'f','onePixel',0),
    unitexMask=new CGL.Uniform(shader,'t','texMask',1),
    uniAmount=new CGL.Uniform(shader,'f','amount',amount),
    unilensDistort=new CGL.Uniform(shader,'f','lensDistort',lensDistort);

doSmooth.onChange=function()
{
    if(doSmooth.get())shader.define("SMOOTH");
        else shader.removeDefine("SMOOTH");
};

textureMask.onChange=function()
{
    if(textureMask.get())shader.define("MASK");
        else shader.removeDefine("MASK");
};

render.onTriggered=function()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;

    var texture=cgl.currentTextureEffect.getCurrentSourceTexture();

    uniPixel.setValue(pixel.get()*(1/texture.width));
    uniOnePixel.setValue(1/texture.width);

    cgl.setShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, texture.tex );

    if(textureMask.get()) cgl.setTexture(1, textureMask.get().tex );

    cgl.currentTextureEffect.finish();
    cgl.setPreviousShader();

    trigger.trigger();
};


};

Ops.Gl.TextureEffects.ChromaticAberration.prototype = new CABLES.Op();
CABLES.OPS["38ac43a1-1757-48f4-9450-29f07ac0d376"]={f:Ops.Gl.TextureEffects.ChromaticAberration,objName:"Ops.Gl.TextureEffects.ChromaticAberration"};




// **************************************************************
// 
// Ops.Gl.Meshes.FullscreenRectangle
// 
// **************************************************************

Ops.Gl.Meshes.FullscreenRectangle = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={shader_frag:"\nUNI sampler2D tex;\nIN vec2 texCoord;\n\nvoid main()\n{\n   outColor= texture(tex,vec2(texCoord.x,(1.0-texCoord.y)));\n}\n",shader_vert:"{{MODULES_HEAD}}\n\nIN vec3 vPosition;\nUNI mat4 projMatrix;\nUNI mat4 mvMatrix;\n\nOUT vec2 texCoord;\nIN vec2 attrTexCoord;\n\nvoid main()\n{\n   vec4 pos=vec4(vPosition,  1.0);\n\n   texCoord=attrTexCoord;\n\n   gl_Position = projMatrix * mvMatrix * pos;\n}\n",};
const
    render=op.inTrigger('render'),
    centerInCanvas=op.inValueBool("Center in Canvas"),
    flipY=op.inValueBool("Flip Y"),
    inTexture=op.inTexture("Texture"),
    trigger=op.outTrigger('trigger');

const cgl=op.patch.cgl;
var mesh=null;
var geom=new CGL.Geometry("fullscreen rectangle");
var x=0,y=0,z=0,w=0,h=0;

centerInCanvas.onChange=rebuild;
flipY.onChange=rebuild;

var shader=null;
render.onTriggered=doRender;

op.toWorkPortsNeedToBeLinked(render);

inTexture.onChange=function()
{
    var tex=inTexture.get();
    // shader=null;
    if(tex && !shader)
    {
        shader=new CGL.Shader(cgl,'fullscreenrectangle');
        shader.setModules(['MODULE_VERTEX_POSITION','MODULE_COLOR','MODULE_BEGIN_FRAG']);

        shader.setSource(attachments.shader_vert,attachments.shader_frag);
        shader.fullscreenRectUniform=new CGL.Uniform(shader,'t','tex',0);
    }

    if(!tex)
    {
        shader=null;
    }
};

op.preRender=function()
{
    if(shader)shader.bind();
    if(mesh)mesh.render(shader);
    doRender();
};

function doRender()
{
    if( cgl.getViewPort()[2]!=w || cgl.getViewPort()[3]!=h ) rebuild();

    cgl.pushPMatrix();
    mat4.identity(cgl.pMatrix);
    mat4.ortho(cgl.pMatrix, 0, w,h, 0, -10.0, 1000);

    cgl.pushModelMatrix();
    mat4.identity(cgl.mMatrix);

    cgl.pushViewMatrix();
    mat4.identity(cgl.vMatrix);

    if(centerInCanvas.get())
    {
        var x=0;
        var y=0;
        if(w<cgl.canvasWidth) x=(cgl.canvasWidth-w)/2;
        if(h<cgl.canvasHeight) y=(cgl.canvasHeight-h)/2;

        cgl.setViewPort(x,y,w,h);
    }

    if(shader)
    {
        if(inTexture.get())
        {
            cgl.setTexture(0,inTexture.get().tex);
            // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, inTexture.get().tex);
        }

        mesh.render(shader);
    }
    else
    {
        mesh.render(cgl.getShader());
    }

    cgl.gl.clear(cgl.gl.DEPTH_BUFFER_BIT);

    cgl.popPMatrix();
    cgl.popModelMatrix();
    cgl.popViewMatrix();

    trigger.trigger();
}


function rebuild()
{
    const currentViewPort=cgl.getViewPort();
    if(currentViewPort[2]==w && currentViewPort[3]==h)return;

    var xx=0,xy=0;

    w=currentViewPort[2];
    h=currentViewPort[3];

    geom.vertices = new Float32Array([
         xx+w, xy+h,  0.0,
         xx,   xy+h,  0.0,
         xx+w, xy,    0.0,
         xx,   xy,    0.0
    ]);

    if(flipY.get())
        geom.setTexCoords( new Float32Array([
             1.0, 0.0,
             0.0, 0.0,
             1.0, 1.0,
             0.0, 1.0
        ]));
    else
        geom.setTexCoords(new Float32Array([
             1.0, 1.0,
             0.0, 1.0,
             1.0, 0.0,
             0.0, 0.0
        ]));

    geom.verticesIndices = new Float32Array([
        2, 1, 0,
        3, 1, 2
    ]);


    geom.vertexNormals=new Float32Array([
        0,0,1,
        0,0,1,
        0,0,1,
        0,0,1,
        ]);
    geom.tangents=new Float32Array([
        -1,0,0,
        -1,0,0,
        -1,0,0,
        -1,0,0]);
    geom.biTangents==new Float32Array([
        0,-1,0,
        0,-1,0,
        0,-1,0,
        0,-1,0]);

                // norms.push(0,0,1);
                // tangents.push(-1,0,0);
                // biTangents.push(0,-1,0);


    if(!mesh) mesh=new CGL.Mesh(cgl,geom);
        else mesh.setGeom(geom);
}


};

Ops.Gl.Meshes.FullscreenRectangle.prototype = new CABLES.Op();
CABLES.OPS["255bd15b-cc91-4a12-9b4e-53c710cbb282"]={f:Ops.Gl.Meshes.FullscreenRectangle,objName:"Ops.Gl.Meshes.FullscreenRectangle"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.DrawImageNew
// 
// **************************************************************

Ops.Gl.TextureEffects.DrawImageNew = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={drawimage_frag:"#ifdef HAS_TEXTURES\n    IN vec2 texCoord;\n    UNI sampler2D tex;\n    UNI sampler2D image;\n#endif\n\nIN mat3 transform;\nUNI float rotate;\n{{BLENDCODE}}\n\n#ifdef HAS_TEXTUREALPHA\n   UNI sampler2D imageAlpha;\n#endif\n\nUNI float amount;\n\n#ifdef ASPECT_RATIO\n    UNI float aspectTex;\n    UNI float aspectPos;\n#endif\n\nvoid main()\n{\n    vec4 blendRGBA=vec4(0.0,0.0,0.0,1.0);\n    #ifdef HAS_TEXTURES\n        vec2 tc=texCoord;\n\n        #ifdef TEX_FLIP_X\n            tc.x=1.0-tc.x;\n        #endif\n        #ifdef TEX_FLIP_Y\n            tc.y=1.0-tc.y;\n        #endif\n\n        #ifdef ASPECT_RATIO\n            // if(aspectTex<1.0)\n                tc.y=(1.0-aspectPos)-(((1.0-aspectPos)-tc.y)*aspectTex);\n                // else\n                // tc.x=(1.0-aspectPos)-(((1.0-aspectPos)-tc.x)*aspectTex);\n        #endif\n\n        #ifdef TEX_TRANSFORM\n            vec3 coordinates=vec3(tc.x, tc.y,1.0);\n            tc=(transform * coordinates ).xy;\n        #endif\n\n        blendRGBA=texture(image,tc);\n\n        vec3 blend=blendRGBA.rgb;\n        vec4 baseRGBA=texture(tex,texCoord);\n        vec3 base=baseRGBA.rgb;\n\n        vec3 colNew=_blend(base,blend);\n\n        #ifdef REMOVE_ALPHA_SRC\n            blendRGBA.a=1.0;\n        #endif\n\n        #ifdef HAS_TEXTUREALPHA\n            vec4 colImgAlpha=texture(imageAlpha,texCoord);\n            float colImgAlphaAlpha=colImgAlpha.a;\n\n            #ifdef ALPHA_FROM_LUMINANCE\n                vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), colImgAlpha.rgb ));\n                colImgAlphaAlpha=(gray.r+gray.g+gray.b)/3.0;\n            #endif\n\n            blendRGBA.a=colImgAlphaAlpha*blendRGBA.a;\n        #endif\n\n\n    #endif\n\n    #ifdef CLIP_REPEAT\n        if(tc.y>1.0 || tc.y<0.0 || tc.x>1.0 || tc.x<0.0)colNew.rgb=vec3(0.0);\n    #endif\n\n\n    blendRGBA.rgb=mix( colNew, base ,1.0-blendRGBA.a*amount);\n    blendRGBA.a=1.0;\n\n\n\n    outColor= blendRGBA;\n\n}",drawimage_vert:"IN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN vec3 attrVertNormal;\n\nUNI mat4 projMatrix;\nUNI mat4 mvMatrix;\n\nUNI float posX;\nUNI float posY;\nUNI float scaleX;\nUNI float scaleY;\nUNI float rotate;\n\nOUT vec2 texCoord;\nOUT vec3 norm;\nOUT mat3 transform;\n\nvoid main()\n{\n   texCoord=attrTexCoord;\n   norm=attrVertNormal;\n\n   #ifdef TEX_TRANSFORM\n        vec3 coordinates=vec3(attrTexCoord.x, attrTexCoord.y,1.0);\n        float angle = radians( rotate );\n        vec2 scale= vec2(scaleX,scaleY);\n        vec2 translate= vec2(posX,posY);\n\n        transform = mat3(   scale.x * cos( angle ), scale.x * sin( angle ), 0.0,\n            - scale.y * sin( angle ), scale.y * cos( angle ), 0.0,\n            - 0.5 * scale.x * cos( angle ) + 0.5 * scale.y * sin( angle ) - 0.5 * translate.x*2.0 + 0.5,  - 0.5 * scale.x * sin( angle ) - 0.5 * scale.y * cos( angle ) - 0.5 * translate.y*2.0 + 0.5, 1.0);\n   #endif\n\n   gl_Position = projMatrix * mvMatrix * vec4(vPosition,  1.0);\n}\n",};
var render=op.inTrigger('render');
var blendMode=CGL.TextureEffect.AddBlendSelect(op,"blendMode");
var amount=op.inValueSlider("amount",1);

var image=op.inTexture("image");
var removeAlphaSrc=op.inValueBool("removeAlphaSrc",false);


var imageAlpha=op.inTexture("imageAlpha");
var alphaSrc=op.inValueSelect("alphaSrc",['alpha channel','luminance']);
var invAlphaChannel=op.inValueBool("invert alpha channel");



var inAspect=op.inValueBool("Aspect Ratio",false);
var inAspectPos=op.inValueSlider("Position",0.0);


var trigger=op.outTrigger('trigger');

blendMode.set('normal');
var cgl=op.patch.cgl;
var shader=new CGL.Shader(cgl,'drawimage');
var srcFrag=attachments.drawimage_frag.replace('{{BLENDCODE}}',CGL.TextureEffect.getBlendCode());

imageAlpha.onLinkChanged=updateAlphaPorts;

op.setPortGroup("Mask",[imageAlpha,alphaSrc,invAlphaChannel]);
op.setPortGroup("Aspect Ratio",[inAspect,inAspectPos]);


removeAlphaSrc.onChange=updateRemoveAlphaSrc;

function updateAlphaPorts()
{
    if(imageAlpha.isLinked())
    {
        removeAlphaSrc.setUiAttribs({greyout:true});
        alphaSrc.setUiAttribs({greyout:false});
        invAlphaChannel.setUiAttribs({greyout:false});
    }
    else
    {
        removeAlphaSrc.setUiAttribs({greyout:false});
        alphaSrc.setUiAttribs({greyout:true});
        invAlphaChannel.setUiAttribs({greyout:true});
    }
}

op.toWorkPortsNeedToBeLinked(image);


shader.setSource(attachments.drawimage_vert,srcFrag);
var textureUniform=new CGL.Uniform(shader,'t','tex',0);
var textureImaghe=new CGL.Uniform(shader,'t','image',1);
var textureAlpha=new CGL.Uniform(shader,'t','imageAlpha',2);

const uniTexAspect=new CGL.Uniform(shader,'f','aspectTex',1);
const uniAspectPos=new CGL.Uniform(shader,'f','aspectPos',inAspectPos);

invAlphaChannel.onChange=function()
{
    if(invAlphaChannel.get()) shader.define('INVERT_ALPHA');
        else shader.removeDefine('INVERT_ALPHA');
};


inAspect.onChange=updateAspectRatio;
function updateAspectRatio()
{
    if(inAspect.get())
    {
        shader.define('ASPECT_RATIO');
        inAspectPos.setUiAttribs({greyout:false});
    }
    else
    {
        shader.removeDefine('ASPECT_RATIO');
        inAspectPos.setUiAttribs({greyout:true});
    }
}




function updateRemoveAlphaSrc()
{
    if(removeAlphaSrc.get()) shader.define('REMOVE_ALPHA_SRC');
        else shader.removeDefine('REMOVE_ALPHA_SRC');
}


alphaSrc.onChange=function()
{
    if(alphaSrc.get()=='luminance') shader.define('ALPHA_FROM_LUMINANCE');
        else shader.removeDefine('ALPHA_FROM_LUMINANCE');
};

alphaSrc.set("alpha channel");


{
    //
    // texture flip
    //
    var flipX=op.addInPort(new CABLES.Port(op,"flip x",CABLES.OP_PORT_TYPE_VALUE,{ display:'bool' }));
    var flipY=op.addInPort(new CABLES.Port(op,"flip y",CABLES.OP_PORT_TYPE_VALUE,{ display:'bool' }));

    flipX.onChange=function()
    {
        if(flipX.get()) shader.define('TEX_FLIP_X');
            else shader.removeDefine('TEX_FLIP_X');
    };

    flipY.onChange=function()
    {
        if(flipY.get()) shader.define('TEX_FLIP_Y');
            else shader.removeDefine('TEX_FLIP_Y');
    };
}

{
    //
    // texture transform
    //

    var doTransform=op.inValueBool("Transform");

    var scaleX=op.inValueSlider("Scale X",1);
    var scaleY=op.inValueSlider("Scale Y",1);

    var posX=op.inValue("Position X",0);
    var posY=op.inValue("Position Y",0);

    var rotate=op.inValue("Rotation",0);

    var inClipRepeat=op.inValueBool("Clip Repeat",false);

    inClipRepeat.onChange=updateClip;
    function updateClip()
    {
        if(inClipRepeat.get()) shader.define('CLIP_REPEAT');
            else shader.removeDefine('CLIP_REPEAT');
    }


    var uniScaleX=new CGL.Uniform(shader,'f','scaleX',scaleX);
    var uniScaleY=new CGL.Uniform(shader,'f','scaleY',scaleY);

    var uniPosX=new CGL.Uniform(shader,'f','posX',posX);
    var uniPosY=new CGL.Uniform(shader,'f','posY',posY);
    var uniRotate=new CGL.Uniform(shader,'f','rotate',rotate);

    doTransform.onChange=updateTransformPorts;
}

function updateTransformPorts()
{
    if(doTransform.get())
    {
        shader.define('TEX_TRANSFORM');
        scaleX.setUiAttribs({hidePort:false,greyout:false});
        scaleY.setUiAttribs({hidePort:false,greyout:false});
        posX.setUiAttribs({hidePort:false,greyout:false});
        posY.setUiAttribs({hidePort:false,greyout:false});
        rotate.setUiAttribs({hidePort:false,greyout:false});
    }
    else
    {
        shader.removeDefine('TEX_TRANSFORM');
        scaleX.setUiAttribs({hidePort:true,greyout:true});
        scaleY.setUiAttribs({hidePort:true,greyout:true});
        posX.setUiAttribs({hidePort:true,greyout:true});
        posY.setUiAttribs({hidePort:true,greyout:true});
        rotate.setUiAttribs({hidePort:true,greyout:true});
    }
}



CGL.TextureEffect.setupBlending(op,shader,blendMode,amount);


var amountUniform=new CGL.Uniform(shader,'f','amount',amount);



imageAlpha.onChange=function()
{
    if(imageAlpha.get() && imageAlpha.get().tex)
    {
        shader.define('HAS_TEXTUREALPHA');
    }
    else
    {
        shader.removeDefine('HAS_TEXTUREALPHA');
    }
};


function doRender()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;

    var tex=image.get();
    if(tex && tex.tex && amount.get()>0.0)
    {
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        const imgTex=cgl.currentTextureEffect.getCurrentSourceTexture();
        cgl.setTexture(0,imgTex.tex );


        // if(tex.width>tex.height)
        //     uniTexAspect.setValue(   (tex.width/tex.height*imgTex.width/imgTex.height));
        // else

        uniTexAspect.setValue( 1/(tex.height/tex.width*imgTex.width/imgTex.height));
        // console.log(uniTexAspect.getValue());
        // uniTexAspect.setValue( (tex.height/tex.width*imgTex.height/imgTex.width));



        cgl.setTexture(1, tex.tex );
        // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, image.get().tex );

        if(imageAlpha.get() && imageAlpha.get().tex)
        {
            cgl.setTexture(2, imageAlpha.get().tex );
            // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, imageAlpha.get().tex );
        }

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();
    }

    trigger.trigger();
}

render.onTriggered=doRender;
updateTransformPorts();
updateRemoveAlphaSrc();
updateAlphaPorts();
updateAspectRatio();


};

Ops.Gl.TextureEffects.DrawImageNew.prototype = new CABLES.Op();
CABLES.OPS["f94b5136-61fd-4558-8348-e7c8db5a6348"]={f:Ops.Gl.TextureEffects.DrawImageNew,objName:"Ops.Gl.TextureEffects.DrawImageNew"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.ImageCompose
// 
// **************************************************************

Ops.Gl.TextureEffects.ImageCompose = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const render=op.inTrigger("render");
const useVPSize=op.addInPort(new CABLES.Port(op,"use viewport size",CABLES.OP_PORT_TYPE_VALUE,{ display:'bool' }));
const width=op.inValueInt("width");
const height=op.inValueInt("height");

const tfilter=op.inValueSelect("filter",['nearest','linear','mipmap'],"linear");
const twrap=op.inValueSelect("wrap",['clamp to edge','repeat','mirrored repeat']);
const fpTexture=op.inValueBool("HDR");

const trigger=op.outTrigger("trigger");
const texOut=op.outTexture("texture_out");

const bgAlpha=op.inValueSlider("Background Alpha",1);
const outRatio=op.outValue("Aspect Ratio");

op.setPortGroup("Texture Size",[useVPSize,width,height]);
op.setPortGroup("Texture Settings",[twrap,tfilter,fpTexture]);



texOut.set(null);
var cgl=op.patch.cgl;
var effect=null;
var tex=null;

var w=8,h=8;
var prevViewPort=[0,0,0,0];
var reInitEffect=true;

var bgFrag=''
    .endl()+'uniform float a;'
    .endl()+'void main()'
    .endl()+'{'
    .endl()+'   outColor= vec4(0.0,0.0,0.0,a);'
    .endl()+'}';
var bgShader=new CGL.Shader(cgl,'imgcompose bg');
bgShader.setSource(bgShader.getDefaultVertexShader(),bgFrag);
var uniBgAlpha=new CGL.Uniform(bgShader,'f','a',bgAlpha);

var selectedFilter=CGL.Texture.FILTER_LINEAR;
var selectedWrap=CGL.Texture.WRAP_CLAMP_TO_EDGE;

function initEffect()
{
    if(effect)effect.delete();
    if(tex)tex.delete();

    effect=new CGL.TextureEffect(cgl,{"isFloatingPointTexture":fpTexture.get()});

    tex=new CGL.Texture(cgl,
        {
            "name":"image compose",
            "isFloatingPointTexture":fpTexture.get(),
            "filter":selectedFilter,
            "wrap":selectedWrap,
            "width": Math.ceil(width.get()),
            "height": Math.ceil(height.get()),
        });

    effect.setSourceTexture(tex);
    texOut.set(null);
    // texOut.set(effect.getCurrentSourceTexture());

    reInitEffect=false;

    // op.log("reinit effect");
    // tex.printInfo();
}

fpTexture.onChange=function()
{
    reInitEffect=true;
};

function updateResolution()
{
    if(!effect)initEffect();

    if(useVPSize.get())
    {
        w=cgl.getViewPort()[2];
        h=cgl.getViewPort()[3];
    }
    else
    {
        w=Math.ceil(width.get());
        h=Math.ceil(height.get());
    }

    if((w!=tex.width || h!= tex.height) && (w!==0 && h!==0))
    {
        height.set(h);
        width.set(w);
        tex.setSize(w,h);
        outRatio.set(w/h);
        effect.setSourceTexture(tex);
        texOut.set(null);
        texOut.set(tex);
    }

    if(texOut.get())
        if(!texOut.get().isPowerOfTwo() )
        {
            if(!op.uiAttribs.hint)
                op.uiAttr(
                    {
                        hint:'texture dimensions not power of two! - texture filtering will not work.',
                        warning:null
                    });
        }
        else
        if(op.uiAttribs.hint)
        {
            op.uiAttr({hint:null,warning:null}); //todo only when needed...
        }

}


function updateSizePorts()
{
    if(useVPSize.get())
    {
        width.setUiAttribs({greyout:true});
        height.setUiAttribs({greyout:true});
    }
    else
    {
        width.setUiAttribs({greyout:false});
        height.setUiAttribs({greyout:false});
    }
}


useVPSize.onChange=function()
{
    updateSizePorts();
    if(useVPSize.get())
    {
        width.onChange=null;
        height.onChange=null;
    }
    else
    {
        width.onChange=updateResolution;
        height.onChange=updateResolution;
    }
    updateResolution();

};


op.preRender=function()
{
    doRender();
    bgShader.bind();
};


var doRender=function()
{
    if(!effect || reInitEffect)
    {
        initEffect();
    }
    var vp=cgl.getViewPort();
    prevViewPort[0]=vp[0];
    prevViewPort[1]=vp[1];
    prevViewPort[2]=vp[2];
    prevViewPort[3]=vp[3];


    cgl.gl.blendFunc(cgl.gl.SRC_ALPHA, cgl.gl.ONE_MINUS_SRC_ALPHA);
    // cgl.gl.blendFunc(cgl.gl.SRC_ALPHA,cgl.gl.ONE_MINUS_SRC_ALPHA);



    updateResolution();

    cgl.currentTextureEffect=effect;
    effect.setSourceTexture(tex);

    effect.startEffect();

    // render background color...
    cgl.setShader(bgShader);
    cgl.currentTextureEffect.bind();
    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex );
    cgl.currentTextureEffect.finish();
    cgl.setPreviousShader();

    trigger.trigger();

    texOut.set(effect.getCurrentSourceTexture());
    // texOut.set(effect.getCurrentTargetTexture());


    // if(effect.getCurrentSourceTexture.filter==CGL.Texture.FILTER_MIPMAP)
    // {
    //         this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_2D, effect.getCurrentSourceTexture.tex);
    //         effect.getCurrentSourceTexture.updateMipMap();
    //     // else
    //     // {
    //     //     this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_2D, this._textureSource.tex);;
    //     //     this._textureSource.updateMipMap();
    //     // }

    //     this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_2D, null);
    // }

    effect.endEffect();

    cgl.setViewPort(prevViewPort[0],prevViewPort[1],prevViewPort[2],prevViewPort[3]);


    cgl.gl.blendFunc(cgl.gl.SRC_ALPHA,cgl.gl.ONE_MINUS_SRC_ALPHA);

    cgl.currentTextureEffect=null;
};


function onWrapChange()
{
    if(twrap.get()=='repeat') selectedWrap=CGL.Texture.WRAP_REPEAT;
    if(twrap.get()=='mirrored repeat') selectedWrap=CGL.Texture.WRAP_MIRRORED_REPEAT;
    if(twrap.get()=='clamp to edge') selectedWrap=CGL.Texture.WRAP_CLAMP_TO_EDGE;

    reInitEffect=true;
    updateResolution();
}

twrap.set('clamp to edge');
twrap.onChange=onWrapChange;

function onFilterChange()
{
    if(tfilter.get()=='nearest') selectedFilter=CGL.Texture.FILTER_NEAREST;
    if(tfilter.get()=='linear')  selectedFilter=CGL.Texture.FILTER_LINEAR;
    if(tfilter.get()=='mipmap')  selectedFilter=CGL.Texture.FILTER_MIPMAP;

    reInitEffect=true;
    updateResolution();
    // effect.setSourceTexture(tex);
    // updateResolution();
}

tfilter.set('linear');
tfilter.onChange=onFilterChange;

useVPSize.set(true);
render.onTriggered=doRender;

width.set(640);
height.set(360);
updateSizePorts();

};

Ops.Gl.TextureEffects.ImageCompose.prototype = new CABLES.Op();
CABLES.OPS["5c04608d-1e42-4e36-be00-1be4a81fc309"]={f:Ops.Gl.TextureEffects.ImageCompose,objName:"Ops.Gl.TextureEffects.ImageCompose"};




// **************************************************************
// 
// Ops.Gl.Perspective
// 
// **************************************************************

Ops.Gl.Perspective = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
// http://stackoverflow.com/questions/5504635/computing-fovx-opengl

var render=op.inTrigger('render');
var fovY=op.inValueFloat("fov y",45);
var zNear=op.inValueFloat("frustum near",0.01);
var zFar=op.inValueFloat("frustum far",20);
var autoAspect=op.inValueBool("Auto Aspect Ratio",true);
var aspect=op.inValue("Aspect Ratio");

var trigger=op.outTrigger('trigger');


var cgl=op.patch.cgl;

fovY.onChange=zFar.onChange=zNear.onChange=changed;

changed();

op.setPortGroup("Field of View",fovY);
op.setPortGroup("Frustrum",zNear,zFar);

var asp=0;

render.onTriggered=function()
{
    asp=cgl.getViewPort()[2]/cgl.getViewPort()[3];
    if(!autoAspect.get())asp=aspect.get();

    cgl.pushPMatrix();
    mat4.perspective(
        cgl.pMatrix,
        fovY.get()*0.0174533,
        asp,
        zNear.get(),
        zFar.get());

    trigger.trigger();

    cgl.popPMatrix();
};

function changed()
{
    cgl.frameStore.perspective=
    {
        fovy:fovY.get(),
        zFar:zFar.get(),
        zNear:zNear.get(),
    };
}



};

Ops.Gl.Perspective.prototype = new CABLES.Op();
CABLES.OPS["7a78e163-d28c-4f70-a6d0-6d952da79f50"]={f:Ops.Gl.Perspective,objName:"Ops.Gl.Perspective"};




// **************************************************************
// 
// Ops.Array.ParseArray2
// 
// **************************************************************

Ops.Array.ParseArray2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var text=op.inStringEditor("text",'1,2,3');
var separator=op.inValueString("separator",",");
var toNumber=op.inValueBool("Numbers",true);
var parsed=op.outTrigger("Parsed");
var arr=op.outArray("array");
var len=op.outValue("length");

text.onChange=parse;
separator.onChange=parse;
toNumber.onChange=parse;

parse();

function parse()
{
    if(!text.get())return;

    var r=text.get().split(separator.get());
    len.set(r.length);

    if(toNumber.get())
    {
        for(var i=0;i<r.length;i++)
        {
            r[i]=Number(r[i]);
        }
    }

    arr.set(null);
    arr.set(r);
    parsed.trigger();
}


};

Ops.Array.ParseArray2.prototype = new CABLES.Op();
CABLES.OPS["c974de41-4ce4-4432-b94d-724741109c71"]={f:Ops.Array.ParseArray2,objName:"Ops.Array.ParseArray2"};




// **************************************************************
// 
// Ops.Trigger.TriggerOnce
// 
// **************************************************************

Ops.Trigger.TriggerOnce = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe=op.inTriggerButton("Exec"),
    reset=op.inTriggerButton("Reset"),
    next=op.outTrigger("Next");
var outTriggered=op.outValue("Was Triggered");

var triggered=false;

op.toWorkPortsNeedToBeLinked(exe,next);

reset.onTriggered=function()
{
    triggered=false;
    outTriggered.set(triggered);
};

exe.onTriggered=function()
{
    if(triggered)return;

    triggered=true;
    next.trigger();
    outTriggered.set(triggered);

};

};

Ops.Trigger.TriggerOnce.prototype = new CABLES.Op();
CABLES.OPS["cf3544e4-e392-432b-89fd-fcfb5c974388"]={f:Ops.Trigger.TriggerOnce,objName:"Ops.Trigger.TriggerOnce"};




// **************************************************************
// 
// Ops.Math.Sine
// 
// **************************************************************

Ops.Math.Sine = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
// input
var value = op.inValue('value');

var phase = op.inValue('phase', 0.0);
var mul = op.inValue('frequency', 1.0);
var amplitude = op.inValue('amplitude', 1.0);
var invert = op.inValueBool("asine", false);

// output
var result = op.outValue('result');

var calculate = Math.sin;

phase.onChange = 
value.onChange = function()
{
    result.set(
        amplitude.get() * calculate( ( value.get()*mul.get() ) + phase.get() )
    );
};

invert.onChange = function()
{
    if(invert.get()) calculate = Math.asin;
    else calculate = Math.sin;
}


};

Ops.Math.Sine.prototype = new CABLES.Op();
CABLES.OPS["d24da018-9f3d-428b-85c9-6ff14d77548b"]={f:Ops.Math.Sine,objName:"Ops.Math.Sine"};




// **************************************************************
// 
// Ops.Value.ValueRouter
// 
// **************************************************************

Ops.Value.ValueRouter = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
// constants
var NUM_PORTS = 10;
var DEFAULT_VALUE_DEFAULT = 0;

// input
var indexPort = op.inValue('Index');
var valuePort = op.inValue('Value');
var defaultValuePort = op.inValue('Default Value', DEFAULT_VALUE_DEFAULT);

// output
var valuePorts = createOutPorts(DEFAULT_VALUE_DEFAULT);

// change listeners
indexPort.onChange = update;
valuePort.onChange = update; // TODO: Maybe only one update needed!?
defaultValuePort.onChange = setDefaultValues;

setDefaultValues();

// functions

/**
 * creates the output-port array
 */
function createOutPorts() {
    var arr = [];
    for(var i=0; i<NUM_PORTS; i++) {
        var port = op.outValue('Index ' + i + ' Value');
        arr.push(port);
    }
    return arr;
}

/**
 * Sets all value ports to the default value
 */
function setDefaultValues() {
    var defaultValue = defaultValuePort.get();
    valuePorts.forEach(function(valuePort) {
        valuePort.set(defaultValue);
    });
}

/**
 * Update
 */
function update() {
    var index = indexPort.get();
    var value = valuePort.get();
    index = Math.round(index);
    index = clamp(index, 0, NUM_PORTS-1);   
    valuePorts[index].set(value);
}

/**
 * Returns a number whose value is limited to the given range.
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}


};

Ops.Value.ValueRouter.prototype = new CABLES.Op();
CABLES.OPS["e3b1fc2d-a813-4d9b-8cb0-595fc95af4e2"]={f:Ops.Value.ValueRouter,objName:"Ops.Value.ValueRouter"};




// **************************************************************
// 
// Ops.Math.Incrementor
// 
// **************************************************************

Ops.Math.Incrementor = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var increment = op.inTriggerButton("Increment");
var decrement = op.inTriggerButton("Decrement");
var inLength=op.inValueInt("Length");
var reset=op.inTriggerButton("Reset");
var inMode=op.inValueSelect("Mode",["Rewind","Stop at Max"]);
var value=op.outValue("Value");
var outRestarted=op.outTrigger("Restarted");


value.ignoreValueSerialize=true;
inLength.set(10);
var val=0;
value.set(0);

inLength.onTriggered=reset;
reset.onTriggered=doReset;

var MODE_REWIND=0;
var MODE_STOP=1;

var mode=MODE_REWIND;

inMode.onChange=function()
{
    if(inMode.get()=="Rewind")
    {
        mode=MODE_REWIND;
    }
    if(inMode.get()=="Stop at Max")
    {
        mode=MODE_STOP;
    }
};

function doReset()
{
    value.set(null);
    val=0;
    value.set(val);
    outRestarted.trigger();
}

decrement.onTriggered=function()
{
    val--;
    if(mode==MODE_REWIND && val<0)val=inLength.get()-1;
    if(mode==MODE_STOP && val<0)val=0;

    value.set(val);
};

increment.onTriggered=function()
{
    val++;
    if(mode==MODE_REWIND && val>=inLength.get())
    {
        val=0;
        outRestarted.trigger();
    }
    if(mode==MODE_STOP && val>=inLength.get())val=inLength.get()-1;

    value.set(val);
};


};

Ops.Math.Incrementor.prototype = new CABLES.Op();
CABLES.OPS["45cc0011-ada8-4423-8f5b-39a3810b8389"]={f:Ops.Math.Incrementor,objName:"Ops.Math.Incrementor"};




// **************************************************************
// 
// Ops.Vars.SetVariable
// 
// **************************************************************

Ops.Vars.SetVariable = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var val=op.inValueFloat("Value",0);
op.varName=op.inValueSelect("Variable");

op.varName.onChange=updateName;
val.onChange=update;
val.changeAlways=true;

op.patch.addVariableListener(updateVarNamesDropdown);

updateVarNamesDropdown();

function updateVarNamesDropdown()
{
    if(CABLES.UI)
    {
        var varnames=[];
        var vars=op.patch.getVars();
        varnames.push('+ create new one');
        for(var i in vars) varnames.push(i);
        op.varName.uiAttribs.values=varnames;
    }
}

function updateName()
{
    if(CABLES.UI)
    {
        if(op.varName.get()=='+ create new one')
        {
            CABLES.CMD.PATCH.createVariable(op);
            return;
        }

        op.setTitle('#' + op.varName.get());
    }
    update();
}

function update()
{
    op.patch.setVarValue(op.varName.get(),val.get());
}


};

Ops.Vars.SetVariable.prototype = new CABLES.Op();
CABLES.OPS["b0190d08-82f6-45b2-bc0c-b70a3257ea92"]={f:Ops.Vars.SetVariable,objName:"Ops.Vars.SetVariable"};




// **************************************************************
// 
// Ops.Vars.Variable
// 
// **************************************************************

Ops.Vars.Variable = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
op.varName=op.inValueSelect("Variable");
var val=op.outValue("Value");

var variable=null;
op.patch.addVariableListener(init);
init();

updateVarNamesDropdown();

function updateVarNamesDropdown()
{
    if(CABLES.UI)
    {
        var varnames=[];
        var vars=op.patch.getVars();

        for(var i in vars) varnames.push(i);

        varnames.push('+ create new one');
        op.varName.uiAttribs.values=varnames;
    }
}

op.varName.onChange=function()
{
    init();
};

function init()
{
    updateVarNamesDropdown();

    if(CABLES.UI)
    {
        if(op.varName.get()=='+ create new one')
        {
            CABLES.CMD.PATCH.createVariable(op);
            return;
        }
    }

    if(variable)
    {
        variable.removeListener(onChange);
    }

    variable=op.patch.getVar(op.varName.get());

    if(variable)
    {
        variable.addListener(onChange);
        op.uiAttr({error:null,});
        op.setTitle('#'+op.varName.get());
        onChange(variable.getValue());
        // console.log("var value ",variable.getName(),variable.getValue());
    }
    else
    {
        op.uiAttr({error:"unknown variable! - there is no setVariable with this name"});
        op.setTitle('#invalid');
    }
}


function onChange(v)
{
    updateVarNamesDropdown();
    val.set(v);
}

op.onDelete=function()
{
    if(variable)
        variable.removeListener(onChange);
};


};

Ops.Vars.Variable.prototype = new CABLES.Op();
CABLES.OPS["1b9c4504-d69a-43c2-b747-8ca795a8950f"]={f:Ops.Vars.Variable,objName:"Ops.Vars.Variable"};




// **************************************************************
// 
// Ops.Array.ArrayIterator
// 
// **************************************************************

Ops.Array.ArrayIterator = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe=op.inTrigger("exe"),
    arr=op.inArray("array"),
    trigger=op.outTrigger('trigger'),
    idx=op.addOutPort(new CABLES.Port(op,"index")),
    val=op.addOutPort(new CABLES.Port(op,"value"));

exe.onTriggered=function()
{
    if(!arr.get())return;

    for(var i=0;i<arr.get().length;i++)
    {
        idx.set(i);
        val.set(arr.get()[i]);
        trigger.trigger();
        op.patch.instancing.increment();
    }

};


};

Ops.Array.ArrayIterator.prototype = new CABLES.Op();
CABLES.OPS["ec280011-1190-4333-9a68-adb4904fca1a"]={f:Ops.Array.ArrayIterator,objName:"Ops.Array.ArrayIterator"};




// **************************************************************
// 
// Ops.Html.BrowserCheck
// 
// **************************************************************

Ops.Html.BrowserCheck = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var isMobile=op.outValue("Is Mobile",false);
var isIe=op.outValue("Is IE",false);
var isIe10Plus=op.outValue("Is IE 10+",false);
var isIe11=op.outValue("Is IE 11",false);
var isEdge=op.outValue("Is Edge",false);
var isChrome=op.outValue("Is Chrome",false);
var isFirefox=op.outValue("Is Firefox",false);
var isSafari=op.outValue("Is Safari",false);
var isWindows=op.outValue("Is Windows",false);
var isLinux=op.outValue("Is Linux",false);
var isMac=op.outValue("Is Mac",false);
var isIos=op.outValue("Is iOS",false);
var isAndroid=op.outValue("Is Android",false);

var outNav=op.outValue("Language");

outNav.set(navigator.language || navigator.userLanguage);

isFirefox.set(!!navigator.userAgent.search("Firefox"));

if( /^((?!chrome|android).)*safari/i.test(navigator.userAgent) )
{
    isSafari.set(true);
}

if( /MSIE 10/i.test(navigator.userAgent) || /MSIE 9/i.test(navigator.userAgent) || /rv:11.0/i.test(navigator.userAgent))
{
    isIe.set(true);
    isFirefox.set(false);
    if( /MSIE 9/i.test(navigator.userAgent) ) {
        isIe10Plus.set(false);
        isIe11.set(false);
    } else if( /MSIE 10/i.test(navigator.userAgent) ) {
        isIe10Plus.set(true);
        isIe11.set(false);
    } else if( /rv:11.0/i.test(navigator.userAgent) ) {
        isIe10Plus.set(false);
        isIe11.set(true);
    }
}

if(/Edge\/\d./i.test(navigator.userAgent))
{
   isEdge.set(true);
   isFirefox.set(false);
}

var isChromium = window.chrome,
    winNav = window.navigator,
    vendorName = winNav.vendor,
    isOpera = winNav.userAgent.indexOf("OPR") > -1,
    isIEedge = winNav.userAgent.indexOf("Edge") > -1,
    isIOSChrome = winNav.userAgent.match("CriOS");


if(isIOSChrome || (isChromium !== null && isChromium !== undefined && vendorName === "Google Inc." && isOpera === false && isIEedge === false))
{
   // is Google Chrome
   isChrome.set(true);
   isFirefox.set(false);
}
else
{
   // not Google Chrome
}



if(window.navigator.userAgent.indexOf("Windows") != -1)
{
    isWindows.set(true);
}

if(window.navigator.userAgent.indexOf("Linux") != -1)
{
    isWindows.set(false);
    isLinux.set(true);
}

if(window.navigator.userAgent.indexOf("Mac") != -1)
{
    isWindows.set(false);
    isMac.set(true);
}

isIos.set( /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

if(window.navigator.userAgent.toLowerCase().indexOf("android") != -1)
    isAndroid.set(true);




isMobile.set(false);
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) )
isMobile.set(true);



};

Ops.Html.BrowserCheck.prototype = new CABLES.Op();
CABLES.OPS["6e2ff98b-1e85-4b89-b125-fb8da727ba0c"]={f:Ops.Html.BrowserCheck,objName:"Ops.Html.BrowserCheck"};




// **************************************************************
// 
// Ops.Boolean.IfTrueThen
// 
// **************************************************************

Ops.Boolean.IfTrueThen = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe=op.inTrigger("exe"),
    boolean=op.inValueBool("boolean",false),
    triggerThen=op.outTrigger("then"),
    triggerElse=op.outTrigger("else");

boolean.onChange=execBool;
exe.onTriggered=exec;

function execBool()
{
    if(exe.isLinked())return;
    exec();
}

function exec()
{
    if(boolean.get() || boolean.get()>=1 ) triggerThen.trigger();
        else triggerElse.trigger();
}



};

Ops.Boolean.IfTrueThen.prototype = new CABLES.Op();
CABLES.OPS["99892fda-8821-4660-ac57-3103d1546924"]={f:Ops.Boolean.IfTrueThen,objName:"Ops.Boolean.IfTrueThen"};




// **************************************************************
// 
// Ops.Boolean.Or
// 
// **************************************************************

Ops.Boolean.Or = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const bool0=op.inValueBool("bool 1");
const bool1=op.inValueBool("bool 2");
const bool2=op.inValueBool("bool 3");
const bool3=op.inValueBool("bool 4");
const bool4=op.inValueBool("bool 5");
const bool5=op.inValueBool("bool 6");
const bool6=op.inValueBool("bool 7");
const bool7=op.inValueBool("bool 8");

const result=op.outValueBool("result");

bool0.onChange=
    bool1.onChange=
    bool2.onChange=
    bool3.onChange=
    bool4.onChange=
    bool5.onChange=
    bool6.onChange=
    bool7.onChange=exec;

function exec()
{
    result.set( bool0.get() || bool1.get()  || bool2.get() || bool3.get() || bool4.get() || bool5.get() || bool6.get() || bool7.get() );
}



};

Ops.Boolean.Or.prototype = new CABLES.Op();
CABLES.OPS["b3b36238-4592-4e11-afe3-8361c4fd6be5"]={f:Ops.Boolean.Or,objName:"Ops.Boolean.Or"};




// **************************************************************
// 
// Ops.Gl.Render2Texture
// 
// **************************************************************

Ops.Gl.Render2Texture = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var cgl=op.patch.cgl;

var render=op.inTrigger('render');
var useVPSize=op.addInPort(new CABLES.Port(op,"use viewport size",CABLES.OP_PORT_TYPE_VALUE,{ display:'bool' }));

var width=op.inValueInt("texture width");
var height=op.inValueInt("texture height");
var tfilter=op.addInPort(new CABLES.Port(op,"filter",CABLES.OP_PORT_TYPE_VALUE,{display:'dropdown',values:['nearest','linear','mipmap']}));

var msaa=op.inValueSelect("MSAA",["none","2x","4x","8x"],"none");
var trigger=op.outTrigger('trigger');
// var tex=op.addOutPort(new CABLES.Port(op,"texture",CABLES.OP_PORT_TYPE_TEXTURE,{preview:true}));
// var texDepth=op.addOutPort(new CABLES.Port(op,"textureDepth",CABLES.OP_PORT_TYPE_TEXTURE));

var tex=op.outTexture("texture");
var texDepth=op.outTexture("textureDepth");

var fpTexture=op.inValueBool("HDR");
var depth=op.inValueBool("Depth",true);
var clear=op.inValueBool("Clear",true);

var fb=null;

width.set(512);
height.set(512);
useVPSize.set(true);
tfilter.set('linear');
var reInitFb=true;

op.setPortGroup('Alignment',[useVPSize,width,height,tfilter]);


// todo why does it only work when we render a mesh before>?>?????
// only happens with matcap material with normal map....

useVPSize.onChange=updateVpSize;
function updateVpSize()
{
    if(useVPSize.get())
    {
        width.setUiAttribs({greyout:true});
        height.setUiAttribs({greyout:true});
    }
    else
    {
        width.setUiAttribs({greyout:false});
        height.setUiAttribs({greyout:false});
    }
}

fpTexture.onChange=function()
{
    reInitFb=true;
};

depth.onChange=function()
{
    reInitFb=true;
};

clear.onChange=function()
{
    reInitFb=true;
};

var onFilterChange=function()
{
    reInitFb=true;
};

msaa.onChange=function()
{
    reInitFb=true;
};

function doRender()
{
    if(!fb || reInitFb)
    {
        if(fb) fb.delete();
        if(cgl.glVersion>=2)
        {
            var ms=true;
            var msSamples=4;

            if(msaa.get()=="none")
            {
                msSamples=0;
                ms=false;
            }
            if(msaa.get()=="2x")msSamples=2;
            if(msaa.get()=="4x")msSamples=4;
            if(msaa.get()=="8x")msSamples=8;

            fb=new CGL.Framebuffer2(cgl,8,8,
            {
                isFloatingPointTexture:fpTexture.get(),
                multisampling:ms,
                depth:depth.get(),
                multisamplingSamples:msSamples,
                clear:clear.get()
            });
        }
        else
        {
            fb=new CGL.Framebuffer(cgl,8,8,{isFloatingPointTexture:fpTexture.get()});
        }

        if(tfilter.get()=='nearest') fb.setFilter(CGL.Texture.FILTER_NEAREST);
            else if(tfilter.get()=='linear') fb.setFilter(CGL.Texture.FILTER_LINEAR);
            else if(tfilter.get()=='mipmap') fb.setFilter(CGL.Texture.FILTER_MIPMAP);


        texDepth.set( fb.getTextureDepth() );
        reInitFb=false;
    }

    if(useVPSize.val)
    {
        width.set( cgl.getViewPort()[2] );
        height.set( cgl.getViewPort()[3] );
    }

    if(fb.getWidth()!=Math.ceil(width.get()) || fb.getHeight()!=Math.ceil(height.get()) )
    {
        fb.setSize(
            Math.max(1,Math.ceil(width.get())),
            Math.max(1,Math.ceil(height.get())) );
    }

    fb.renderStart(cgl);

    trigger.trigger();
    fb.renderEnd(cgl);

    cgl.resetViewPort();

    tex.set( fb.getTextureColor() );
}


render.onTriggered=doRender;


tfilter.onValueChange(onFilterChange);
updateVpSize();

};

Ops.Gl.Render2Texture.prototype = new CABLES.Op();
CABLES.OPS["d01fa820-396c-4cb5-9d78-6b14762852af"]={f:Ops.Gl.Render2Texture,objName:"Ops.Gl.Render2Texture"};




// **************************************************************
// 
// Ops.Math.Compare.IfBetweenThen
// 
// **************************************************************

Ops.Math.Compare.IfBetweenThen = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var exe=op.inTrigger("exe");

var number=op.inValue("number",0);
var min=op.inValue("min",0);
var max=op.inValue("max",1);

var triggerThen=op.outTrigger('then');
var triggerElse=op.outTrigger('else');
var outBetween=op.outValue("bs between");

exe.onTriggered=function()
{
    if(number.get()>=min.get() && number.get()<max.get())
    {
        outBetween.set(true);
        triggerThen.trigger();
    }
    else
    {
        outBetween.set(false);
        triggerElse.trigger();
    }
};


};

Ops.Math.Compare.IfBetweenThen.prototype = new CABLES.Op();
CABLES.OPS["c80437f0-f0e1-465c-9cea-8a044aa2feaa"]={f:Ops.Math.Compare.IfBetweenThen,objName:"Ops.Math.Compare.IfBetweenThen"};




// **************************************************************
// 
// Ops.Devices.Mouse.Mouse
// 
// **************************************************************

Ops.Devices.Mouse.Mouse = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    relative=op.inValueBool("relative"),
    normalize=op.inValueBool("normalize"),
    active=op.inValueBool("Active",true),
    smooth=op.inValueBool("smooth"),
    smoothSpeed=op.inValueFloat("smoothSpeed",20),
    area=op.inValueSelect("Area",['Canvas','Document','Parent Element'],"Canvas"),
    multiply=op.inValueFloat("multiply",1),
    flipY=op.inValueBool("flip y",true),
    outMouseX=op.outValue("x"),
    outMouseY=op.outValue("y"),
    mouseDown=op.outValueBool("button down"),
    mouseClick=op.outTrigger("click"),
    mouseUp=op.outTrigger("Button Up"),
    mouseClickRight=op.outTrigger("click right"),
    mouseOver=op.outValueBool("mouseOver"),
    outButton=op.outValue("button");

var smoothTimer=0;
var cgl=op.patch.cgl;
var listenerElement=null;

function setValue(x,y)
{
    if(normalize.get())
    {
        var w=cgl.canvas.width;
        var h=cgl.canvas.height;
        if(listenerElement==document.body)
        {
            w=listenerElement.clientWidth;
            h=listenerElement.clientHeight;
        }
        outMouseX.set( (x/w*2.0-1.0)*multiply.get() );
        outMouseY.set( (y/h*2.0-1.0)*multiply.get() );
    }
    else
    {
        outMouseX.set( x*multiply.get() );
        outMouseY.set( y*multiply.get() );
    }
}

smooth.onChange=function()
{
    if(smooth.get()) smoothTimer = setInterval(updateSmooth, 5);
        else if(smoothTimer)clearTimeout(smoothTimer);
};

var smoothX,smoothY;
var lineX=0,lineY=0;

normalize.onChange=function()
{
    mouseX=0;
    mouseY=0;
    setValue(mouseX,mouseY);
};

var mouseX=cgl.canvas.width/2;
var mouseY=cgl.canvas.height/2;

lineX=mouseX;
lineY=mouseY;

outMouseX.set(mouseX);
outMouseY.set(mouseY);

var relLastX=0;
var relLastY=0;
var offsetX=0;
var offsetY=0;
addListeners();

area.onChange=addListeners;

var speed=0;

function updateSmooth()
{
    speed=smoothSpeed.get();
    if(speed<=0)speed=0.01;
    var distanceX = Math.abs(mouseX - lineX);
    var speedX = Math.round( distanceX / speed, 0 );
    lineX = (lineX < mouseX) ? lineX + speedX : lineX - speedX;

    var distanceY = Math.abs(mouseY - lineY);
    var speedY = Math.round( distanceY / speed, 0 );
    lineY = (lineY < mouseY) ? lineY + speedY : lineY - speedY;

    setValue(lineX,lineY);
}

function onMouseEnter(e)
{
    mouseDown.set(false);
    mouseOver.set(true);
    speed=smoothSpeed.get();
}

function onMouseDown(e)
{
    outButton.set(e.which);
    mouseDown.set(true);
}

function onMouseUp(e)
{
    outButton.set(0);
    mouseDown.set(false);
    mouseUp.trigger();
}

function onClickRight(e)
{
    mouseClickRight.trigger();
    e.preventDefault();
}

function onmouseclick(e)
{
    mouseClick.trigger();
}


function onMouseLeave(e)
{
    relLastX=0;
    relLastY=0;

    speed=100;

    if(area.get()!='Document')
    {
        // leave anim
        if(smooth.get())
        {
            mouseX=cgl.canvas.width/2;
            mouseY=cgl.canvas.height/2;
        }

    }
    mouseOver.set(false);
    mouseDown.set(false);
}

relative.onChange=function()
{
    offsetX=0;
    offsetY=0;
}

function onmousemove(e)
{
    mouseOver.set(true);

    if(!relative.get())
    {
        if(area.get()!="Document")
        {
            offsetX=e.offsetX;
            offsetY=e.offsetY;
        }
        else
        {
            offsetX=e.clientX;
            offsetY=e.clientY;
        }

        if(smooth.get())
        {
            mouseX=offsetX;

            if(flipY.get()) mouseY=listenerElement.clientHeight-offsetY;
                else mouseY=offsetY;
        }
        else
        {
            if(flipY.get()) setValue(offsetX,listenerElement.clientHeight-offsetY);
                else setValue(offsetX,offsetY);
        }
    }
    else
    {
        if(relLastX!=0 && relLastY!=0)
        {
            offsetX=e.offsetX-relLastX;
            offsetY=e.offsetY-relLastY;
        }
        else
        {

        }

        relLastX=e.offsetX;
        relLastY=e.offsetY;

        mouseX+=offsetX;
        mouseY+=offsetY;

        if(mouseY>460)mouseY=460;
    }
};

function ontouchstart(event)
{
    mouseDown.set(true);

    if(event.touches && event.touches.length>0) onMouseDown(event.touches[0]);
}

function ontouchend(event)
{
    mouseDown.set(false);
    onMouseUp();
}

function removeListeners()
{
    listenerElement.removeEventListener('touchend', ontouchend);
    listenerElement.removeEventListener('touchstart', ontouchstart);

    listenerElement.removeEventListener('click', onmouseclick);
    listenerElement.removeEventListener('mousemove', onmousemove);
    listenerElement.removeEventListener('mouseleave', onMouseLeave);
    listenerElement.removeEventListener('mousedown', onMouseDown);
    listenerElement.removeEventListener('mouseup', onMouseUp);
    listenerElement.removeEventListener('mouseenter', onMouseEnter);
    listenerElement.removeEventListener('contextmenu', onClickRight);
    listenerElement=null;
}

function addListeners()
{
    if(listenerElement)removeListeners();

    listenerElement=cgl.canvas;
    if(area.get()=='Document') listenerElement=document.body;
    if(area.get()=='Parent Element') listenerElement=cgl.canvas.parentElement;

    listenerElement.addEventListener('touchend', ontouchend);
    listenerElement.addEventListener('touchstart', ontouchstart);

    listenerElement.addEventListener('click', onmouseclick);
    listenerElement.addEventListener('mousemove', onmousemove);
    listenerElement.addEventListener('mouseleave', onMouseLeave);
    listenerElement.addEventListener('mousedown', onMouseDown);
    listenerElement.addEventListener('mouseup', onMouseUp);
    listenerElement.addEventListener('mouseenter', onMouseEnter);
    listenerElement.addEventListener('contextmenu', onClickRight);
}

active.onChange=function()
{
    if(listenerElement)removeListeners();
    if(active.get())addListeners();
}

op.onDelete=function()
{
    removeListeners();
};

addListeners();


};

Ops.Devices.Mouse.Mouse.prototype = new CABLES.Op();
CABLES.OPS["0bf51f3e-3161-4cc5-aecf-6e9160089fd2"]={f:Ops.Devices.Mouse.Mouse,objName:"Ops.Devices.Mouse.Mouse"};




// **************************************************************
// 
// Ops.Boolean.TriggerBoolean
// 
// **************************************************************

Ops.Boolean.TriggerBoolean = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};

var inTriggerTrue=op.inTriggerButton("True");
var inTriggerFalse=op.inTriggerButton("false");

var outResult=op.outValueBool("Result");



inTriggerTrue.onTriggered=function()
{
    outResult.set(true);
};

inTriggerFalse.onTriggered=function()
{
    outResult.set(false);
};

};

Ops.Boolean.TriggerBoolean.prototype = new CABLES.Op();
CABLES.OPS["31f65abe-9d6c-4ba6-a291-ef2de41d2087"]={f:Ops.Boolean.TriggerBoolean,objName:"Ops.Boolean.TriggerBoolean"};




// **************************************************************
// 
// Ops.Math.Multiply
// 
// **************************************************************

Ops.Math.Multiply = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const number1=op.inValueFloat("number1");
const number2=op.inValueFloat("number2");
const result=op.outValue("result");

number1.set(1);
number2.set(2);

number1.onChange=update;
number2.onChange=update;
update();

function update()
{
    const n1=number1.get();
    const n2=number2.get();

    if(isNaN(n1))n1=0;
    if(isNaN(n2))n2=0;

    result.set( n1*n2 );
}



};

Ops.Math.Multiply.prototype = new CABLES.Op();
CABLES.OPS["1bbdae06-fbb2-489b-9bcc-36c9d65bd441"]={f:Ops.Math.Multiply,objName:"Ops.Math.Multiply"};




// **************************************************************
// 
// Ops.Html.ElementFadeInOut
// 
// **************************************************************

Ops.Html.ElementFadeInOut = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={fadeInOut_css:"\n.CABLES_animFadedOut\n{\n    display:none !important;\n}\n\n\n.CABLES_animFadeOut\n{\n    animation: CABLES_keysFadeOut $LENGTHs normal forwards ease-in-out;\n}\n\n.CABLES_animFadeIn\n{\n    /*display:block;*/\n    animation: CABLES_keysFadeIn $LENGTHs normal forwards ease-in-out;\n}\n\n@keyframes CABLES_keysFadeIn {\n    from { opacity: 0; }\n    to   { opacity: $FULLOPACITY; }\n}\n\n@keyframes CABLES_keysFadeOut {\n    from { opacity: $FULLOPACITY; }\n    to   { opacity: 0; }\n}\n",};
const inEle=op.inObject("HTML Element");
const inVisible=op.inValueBool("Visible",true);
const inDuration=op.inValue("Duration",0.5);
const inOpacity=op.inValue("Opacity",1);

var theTimeout=null;
inDuration.onChange=update;
inOpacity.onChange=update;

inVisible.onChange=updateVisibility;
var styleEle=null;
var eleId='css_'+CABLES.uuid();

update();

inEle.onChange=updateVisibility;


function updateVisibility()
{
    if(styleEle && inEle.get())
    {
        if(inVisible.get())
        {
            if(!inEle.get().classList.contains('CABLES_animFadeIn'))
            {
                clearTimeout(theTimeout);
                inEle.get().classList.remove("CABLES_animFadedOut");
                inEle.get().classList.remove("CABLES_animFadeOut");
                inEle.get().classList.add("CABLES_animFadeIn");
                theTimeout=setTimeout(function()
                {
                    inEle.get().classList.remove("CABLES_animFadeIn");
                },inDuration.get()*1000);

            }
        }
        else
        {
            if(!inEle.get().classList.contains('CABLES_animFadeOut'))
            {
                inEle.get().classList.remove("CABLES_animFadeIn");
                inEle.get().classList.add("CABLES_animFadeOut");
                theTimeout=setTimeout(function()
                {
                    inEle.get().classList.add("CABLES_animFadedOut");
                },inDuration.get()*1000);
            }
        }
    }
    else
    {
        console.log("fadeInOut: no html element???");
    }
}


function getCssContent()
{
    var css=attachments.fadeInOut_css;
    
    while(css.indexOf("$LENGTH")>-1)css=css.replace('$LENGTH',inDuration.get());
    while(css.indexOf("$FULLOPACITY")>-1)css=css.replace('$FULLOPACITY',inOpacity.get());

    return css;
}

function update()
{
    styleEle=document.getElementById(eleId);

    if(styleEle)
    {
        styleEle.textContent=getCssContent();
    }
    else
    {
        styleEle  = document.createElement('style');
        styleEle.type = 'text/css';
        styleEle.id = eleId;
        styleEle.textContent=getCssContent();

        var head  = document.getElementsByTagName('body')[0];
        head.appendChild(styleEle);
    }
}

op.onDelete=function()
{
    styleEle=document.getElementById(eleId);
    if(styleEle)styleEle.remove();
};


};

Ops.Html.ElementFadeInOut.prototype = new CABLES.Op();
CABLES.OPS["392e65eb-4ebe-4adb-8711-e4cfe059c6c9"]={f:Ops.Html.ElementFadeInOut,objName:"Ops.Html.ElementFadeInOut"};




// **************************************************************
// 
// Ops.Html.DivElement2
// 
// **************************************************************

Ops.Html.DivElement2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inId=op.inString("Id"),
    inClass=op.inString("Class"),
    inText=op.inString("Text","Hello Div"),
    inStyle=op.inValueEditor("Style","position:absolute;z-index:9999;","css"),
    inInteractive=op.inValueBool("Interactive",false),
    inVisible=op.inValueBool("Visible",true),
    inBreaks=op.inValueBool("Convert Line Breaks",false),
    outElement=op.outObject("DOM Element"),
    outHover=op.outValue("Hover"),
    outClicked=op.outTrigger("Clicked");

var listenerElement=null;

var div = document.createElement('div');
var canvas = op.patch.cgl.canvas.parentElement;

canvas.appendChild(div);
outElement.set(div);

inClass.onChange=updateClass;
inBreaks.onChange=inText.onChange=updateText;
inStyle.onChange=updateStyle;
inInteractive.onChange=updateInteractive;
inVisible.onChange=updateVisibility;

updateText();
updateStyle();

op.onDelete=removeElement;


function setCSSVisible(visible)
{
    if(!visible)
    {
        div.style.visibility='hidden';
        div.style.display='none';
    }
    else
    {
        div.style.visibility='visible';
        div.style.display='block';
    }
}

function updateVisibility()
{
    setCSSVisible(inVisible.get());
}

function updateText()
{
    var str=inText.get();
    if(inBreaks.get()) str = str.replace(/(?:\r\n|\r|\n)/g, '<br>');
    div.innerHTML=str;
    outElement.set(null);
    outElement.set(div);
}

function removeElement()
{
    div.parentNode.removeChild(div);
}

function updateStyle()
{
    div.setAttribute("style",inStyle.get());
    updateVisibility();
    outElement.set(null);
    outElement.set(div);
}

function updateClass()
{
    div.setAttribute("class",inClass.get());
}

function onMouseEnter()
{
    outHover.set(true);
}

function onMouseLeave()
{
    outHover.set(false);
}

function onMouseClick()
{
    outClicked.trigger();
}

function updateInteractive()
{
    removeListeners();
    if(inInteractive.get()) addListeners();
}

inId.onChange=function()
{
    div.id=inId.get();
};

function removeListeners()
{
    if(listenerElement)
    {
        listenerElement.removeEventListener('click', onMouseClick);
        listenerElement.removeEventListener('mouseleave', onMouseLeave);
        listenerElement.removeEventListener('mouseenter', onMouseEnter);
        listenerElement=null;
    }
}

function addListeners()
{
    if(listenerElement)removeListeners();

    listenerElement=div;

    if(listenerElement)
    {
        listenerElement.addEventListener('click', onMouseClick);
        listenerElement.addEventListener('mouseleave', onMouseLeave);
        listenerElement.addEventListener('mouseenter', onMouseEnter);
    }
}

op.addEventListener("onEnabledChange",function(enabled)
{
    setCSSVisible( div.style.visibility!='visible' );
});



};

Ops.Html.DivElement2.prototype = new CABLES.Op();
CABLES.OPS["db36db6d-83e4-4d27-b84c-8a20067aaffc"]={f:Ops.Html.DivElement2,objName:"Ops.Html.DivElement2"};




// **************************************************************
// 
// Ops.Html.TransformCSS3DElement
// 
// **************************************************************

Ops.Html.TransformCSS3DElement = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
	cgl = op.patch.cgl,
	origins = [
	    'top-left','top-middle','top-right',
	    'center-left','center-middle','center-right',
	    'bottom-left','bottom-middle','bottom-right'
    ],
	trigger = op.inTrigger('trigger'),
	inElement = op.inObject('DOMElement'),
	inOrigin = op.inValueSelect("origin",origins,'center-middle'),
	next = op.outTrigger('next'),
	sCSSMatrix = mat4.create(),
	sScalingVector = vec3.create()
;

op.uuid = CABLES.uuid();
var oldEle=null;

var elProjection = cgl.canvas.parentElement.querySelector('[data-provide="css3d"]');
if (!elProjection) {
	elProjection = document.createElement('div');
	elProjection.style.position = "absolute";
	elProjection.style.top = elProjection.style.left = 0;
	elProjection.style.width = elProjection.style.height = "100%";
	elProjection.dataset.provide = "css3d";
	elProjection.style.zIndex = 1000;
	elProjection.style.pointerEvents = "none";
	elProjection.style.perspectiveOrigin = "center center";
	cgl.canvas.parentElement.appendChild(elProjection);

	var style = document.createElement('style');
	style.type="text/css";
	style.textContent = [
	    '.cables-loading .cables-css3dview {visibility:hidden;pointer-events:none;}',
	    '.cables-css3dview {position:absolute;left:0;top:0;width:100%;height:100%;transform-style:preserve-3d;}',
        '.cables-css3dview > * {pointer-events:auto;}',
        '.cables-css3dview.origin-top-left > * {}',
        '.cables-css3dview.origin-top-middle > * {transform:translate3d(-50%,0,0);}',
        '.cables-css3dview.origin-top-right > * {transform:translate3d(-100%,0,0);}',
        '.cables-css3dview.origin-center-left > * {transform:translate3d(0,-50%,0);}',
        '.cables-css3dview.origin-center-middle > * {transform:translate3d(-50%,-50%,0);}',
        '.cables-css3dview.origin-center-right > * {transform:translate3d(-100%,-50%,0);}',
        '.cables-css3dview.origin-bottom-left > * {transform:translate3d(0,-100%,0);}',
        '.cables-css3dview.origin-bottom-middle > * {transform:translate3d(-50%,-100%,0);}',
        '.cables-css3dview.origin-bottom-right > * {transform:translate3d(-100%,-100%,0);}'
	].join('\n');
	elProjection.appendChild(style);
}

op.onDelete = function() {
	var el = elProjection.querySelector('[data-ccs3did="'+op.uuid+'"]');
	if(el && el.parentElement) el.parentElement.removeChild(el);
}

function wrap (el) {
	var view = document.createElement('div');
	view.classList.add('cables-css3dview');
	view.dataset.css3did = op.uuid;
	view.appendChild(el);
	return view;
}

inElement.onChange = function (self, el) {
	op.onDelete();
	if (!el) return;
	elProjection.appendChild(wrap(el));
	inOrigin.onChange();
}
inOrigin.onChange = function () {
    var el = inElement.get();
    if (!el || !el.parentElement) return;
    DOMTokenList.prototype.remove.apply(el.parentElement.classList, origins.map(function (o){return 'origin-'+o}));
    el.parentElement.classList.add('origin-'+inOrigin.get());
}
trigger.onTriggered = function () {
	var pxfov = 0.5 / (1 / cgl.pMatrix[5]) * cgl.gl.drawingBufferHeight;
	elProjection.style.perspective = pxfov + "px";
	var a = -2 * cgl.gl.drawingBufferWidth / cgl.gl.drawingBufferHeight;
	vec3.set(
		sScalingVector,
		a / cgl.gl.drawingBufferWidth,
		-2 / cgl.gl.drawingBufferHeight,
		1
	);
	var el = inElement.get();
	if (el) {
		mat4.multiply(
			sCSSMatrix,
			cgl.vMatrix,
			cgl.mMatrix
		);
		mat4.scale(
			sCSSMatrix,
			sCSSMatrix,
			sScalingVector
		);
		if(el.parentElement)
    		el.parentElement.style.transform = "translateZ("+pxfov+"px) matrix3d(" +
    			sCSSMatrix[0] + ',' +
    			-sCSSMatrix[1] + ',' +
    			sCSSMatrix[2] + ',' +
    			sCSSMatrix[3] + ',' +
    			sCSSMatrix[4] + ',' +
    			-sCSSMatrix[5] + ',' +
    			sCSSMatrix[6] + ',' +
    			sCSSMatrix[7] + ',' +
    			sCSSMatrix[8] + ',' +
    			-sCSSMatrix[9] + ',' +
    			sCSSMatrix[10] + ',' +
    			sCSSMatrix[11] + ',' +
    			sCSSMatrix[12] + ',' +
    			-sCSSMatrix[13] + ',' +
    			sCSSMatrix[14] + ',' +
    			sCSSMatrix[15] +
    		") scaleX(-1) translate3d("+
    			cgl.gl.drawingBufferWidth/2+"px,"+
    			cgl.gl.drawingBufferHeight/2+"px"+
    			",0"+
    		")";
	}
	next.trigger();
	oldEle=el;
};
inOrigin.onChange();

function removeProperties(el)
{
    if(!el)el = inElement.get();
    if(el && el.parentElement)el.parentElement.style.transform='';
}

op.onDelete=function()
{
    removeProperties(oldEle);
};

inElement.onLinkChanged = function() 
{
    if(!inElement.isLinked())
        removeProperties(oldEle);
};

op.addEventListener("onEnabledChange",function(enabled)
{
    if(!enabled) removeProperties();
});


};

Ops.Html.TransformCSS3DElement.prototype = new CABLES.Op();
CABLES.OPS["7b81ed97-6fb9-4044-a731-962a2a11db27"]={f:Ops.Html.TransformCSS3DElement,objName:"Ops.Html.TransformCSS3DElement"};




// **************************************************************
// 
// Ops.Time.DelayedTrigger
// 
// **************************************************************

Ops.Time.DelayedTrigger = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const exe=op.inTrigger("exe");
var delay=op.addInPort(new CABLES.Port(op,"delay",CABLES.OP_PORT_TYPE_VALUE));

const next=op.outTrigger("next");

delay.set(1);

var lastTimeout=null;

exe.onTriggered=function()
{
    if(lastTimeout)clearTimeout(lastTimeout);
    lastTimeout=setTimeout(
        function()
        {
            lastTimeout=null;
            next.trigger();
        }, 
        delay.get()*1000);
};

};

Ops.Time.DelayedTrigger.prototype = new CABLES.Op();





// **************************************************************
// 
// Ops.Math.DeltaSum
// 
// **************************************************************

Ops.Math.DeltaSum = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const inVal=op.inValue("Delta Value");
const defVal=op.inValue("Default Value",0);
const inReset=op.inTriggerButton("Reset");
const inLimit=op.inValueBool("Limit",false);
const inMin=op.inValue("Min",0);
const inMax=op.inValue("Max",100);
const inMul=op.inValue("Multiply",1);

inVal.changeAlways=true;

var value=0;
var outVal=op.outValue("Absolute Value");
inLimit.onChange=updateLimit;
updateLimit();

function resetValue()
{
    value=defVal.get();
    outVal.set(value);

}

defVal.onChange=resetValue;
inReset.onTriggered=resetValue;

function updateLimit()
{
    if(!inLimit.get())
    {
        inMin.setUiAttribs({hidePort:true,greyout:true});
        inMax.setUiAttribs({hidePort:true,greyout:true});
    }
    else
    {
        inMin.setUiAttribs({hidePort:false,greyout:false});
        inMax.setUiAttribs({hidePort:false,greyout:false});
    }
}


inVal.onChange=function()
{
    value+=inVal.get()*inMul.get();

    if(inLimit.get())
    {
        if(value<inMin.get())value=inMin.get();
        if(value>inMax.get())value=inMax.get();
    }

    outVal.set(value);
};


};

Ops.Math.DeltaSum.prototype = new CABLES.Op();
CABLES.OPS["d9d4b3db-c24b-48da-b798-9e6230d861f7"]={f:Ops.Math.DeltaSum,objName:"Ops.Math.DeltaSum"};




// **************************************************************
// 
// Ops.Array.RandomArray3x
// 
// **************************************************************

Ops.Array.RandomArray3x = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    numValues=op.inValueInt("numValues",100),
    min=op.inValueFloat("Min",-1),
    max=op.inValueFloat("Max",1),
    seed=op.inValueFloat("random seed"),
    closed=op.inValueBool("Last == First"),
    values=op.outArray("values");

op.setPortGroup("Value Range",[min,max])

values.ignoreValueSerialize=true;

closed.onChange=max.onChange=
    min.onChange=
    numValues.onChange=
    seed.onChange=
    values.onLinkChanged=init;

var arr=[];
init();

function init()
{
    Math.randomSeed=seed.get();

    arr.length=Math.floor(Math.abs(numValues.get()*3)) || 300;
    for(var i=0;i<arr.length;i+=3)
    {
        arr[i+0]=Math.seededRandom() * ( max.get() - min.get() ) + min.get() ;
        arr[i+1]=Math.seededRandom() * ( max.get() - min.get() ) + min.get() ;
        arr[i+2]=Math.seededRandom() * ( max.get() - min.get() ) + min.get() ;
    }

    if(closed.get())
    {
        arr[arr.length-3+0]=arr[0];
        arr[arr.length-3+1]=arr[1];
        arr[arr.length-3+2]=arr[2];
    }

    values.set(null);
    values.set(arr);
}


};

Ops.Array.RandomArray3x.prototype = new CABLES.Op();
CABLES.OPS["7f981578-542e-417b-b304-8fbe41258772"]={f:Ops.Array.RandomArray3x,objName:"Ops.Array.RandomArray3x"};




// **************************************************************
// 
// Ops.Array.ArrayLength
// 
// **************************************************************

Ops.Array.ArrayLength = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    array=op.inArray("array"),
    outLength=op.outValue("length");

outLength.ignoreValueSerialize=true;

function update()
{
    var l=0;
    if(array.get()) l=array.get().length;
    else l=-1;
    outLength.set(l);
}

array.onChange=update;


};

Ops.Array.ArrayLength.prototype = new CABLES.Op();
CABLES.OPS["ea508405-833d-411a-86b4-1a012c135c8a"]={f:Ops.Array.ArrayLength,objName:"Ops.Array.ArrayLength"};




// **************************************************************
// 
// Ops.Array.ArrayMultiply
// 
// **************************************************************

Ops.Array.ArrayMultiply = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var inArray=op.inArray("In");
var inValue=op.inValue("Value",1.0);
var outArray=op.outArray("Result");

var newArr=[];
outArray.set(newArr);
inArray.onChange=
inValue.onChange=inArray.onChange=function()
{
    var arr=inArray.get();
    if(!arr)return;
    
    var mul=inValue.get();
    
    if(newArr.length!=arr.length)newArr.length=arr.length;
    
    for(var i=0;i<arr.length;i++)
    {
        newArr[i]=arr[i]*mul;
    }
    outArray.set(null);
    outArray.set(newArr);
};

};

Ops.Array.ArrayMultiply.prototype = new CABLES.Op();
CABLES.OPS["a01c344b-4129-4b01-9c8f-36cefe86d7cc"]={f:Ops.Array.ArrayMultiply,objName:"Ops.Array.ArrayMultiply"};




// **************************************************************
// 
// Ops.Array.ArraySin
// 
// **************************************************************

Ops.Array.ArraySin = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
//this op allows the user to perform sin or cos
//math functions on an array
const inArray = op.inArray("array in");
const mathSelect = op.inValueSelect("Math function",["Sin","Cos"],"Sin");
const outArray = op.outArray("Array result");

const phase=op.inValue("Phase",0.0);
const multiply=op.inValue("Frequency",1.0);
const amplitude=op.inValue("Amplitude",1.0);

var mathArray = [];
var selectIndex = 0;

const MATH_FUNC_SIN = 0;
const MATH_FUNC_COS = 1;


inArray.onChange = update;
multiply.onChange = update;
amplitude.onChange = update;
phase.onChange = update;
mathSelect.onChange = onFilterChange;

function onFilterChange()
{
    var mathSelectValue = mathSelect.get();
    if(mathSelectValue === "Sin") selectIndex = MATH_FUNC_SIN;
    else if(mathSelectValue === "Cos") selectIndex = MATH_FUNC_COS;
    update();
}

function update()
{
    var arrayIn = inArray.get();
    mathArray.length = 0;

    if(!arrayIn) return;

    mathArray.length = arrayIn.length;

    var amp = amplitude.get();
    var mul = multiply.get();
    var pha = phase.get();

    var i = 0;
    if(selectIndex === MATH_FUNC_SIN)
    {
        for(i = 0; i < arrayIn.length; i++)
            mathArray[i] = amp * Math.sin((arrayIn[i]) *  mul + pha);
    }
    else if(selectIndex === MATH_FUNC_COS)
    {
        for(i = 0; i < arrayIn.length; i++)
            mathArray[i] = amp * (Math.cos(arrayIn[i] * mul + pha));
    }
    outArray.set(null);
    outArray.set(mathArray);
}


};

Ops.Array.ArraySin.prototype = new CABLES.Op();
CABLES.OPS["ded44bae-a24e-48c5-9585-4cb31f331ab6"]={f:Ops.Array.ArraySin,objName:"Ops.Array.ArraySin"};




// **************************************************************
// 
// Ops.Array.ArraySum
// 
// **************************************************************

Ops.Array.ArraySum = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var inArray=op.inArray("In");
var inValue=op.inValue("Value",1.0);
var outArray=op.outArray("Result");

var newArr=[];
outArray.set(newArr);
inArray.onChange=
inValue.onChange=inArray.onChange=function()
{
    var arr=inArray.get();
    if(!arr)return;
    
    var add=inValue.get();
    
    if(newArr.length!=arr.length)newArr.length=arr.length;
    
    for(var i=0;i<arr.length;i++)
    {
        newArr[i]=arr[i]+add;
    }
    outArray.set(null);
    outArray.set(newArr);
};


};

Ops.Array.ArraySum.prototype = new CABLES.Op();
CABLES.OPS["c6b5bf63-0be8-4eea-acc0-9d32973e665a"]={f:Ops.Array.ArraySum,objName:"Ops.Array.ArraySum"};




// **************************************************************
// 
// Ops.Gl.Matrix.Scale
// 
// **************************************************************

Ops.Gl.Matrix.Scale = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    render=op.inTrigger("render"),
    scale=op.inValueFloat("scale",1.0),
    trigger=op.outTrigger("trigger");

const cgl=op.patch.cgl;
const vScale=vec3.create();

scale.onChange=scaleChanged;
scaleChanged();

render.onTriggered=function()
{
    cgl.pushModelMatrix();
    mat4.scale(cgl.mMatrix,cgl.mMatrix, vScale);
    trigger.trigger();
    cgl.popModelMatrix();
};

function scaleChanged()
{
    var s=scale.get();
    vec3.set(vScale, s,s,s);
}



};

Ops.Gl.Matrix.Scale.prototype = new CABLES.Op();
CABLES.OPS["50e7f565-0cdb-47ca-912b-87c04e2f00e3"]={f:Ops.Gl.Matrix.Scale,objName:"Ops.Gl.Matrix.Scale"};




// **************************************************************
// 
// Ops.Array.ArrayUnpack3
// 
// **************************************************************

Ops.Array.ArrayUnpack3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const inArray1=op.inArray("Array in xyz");

const outArray1=op.outArray("Array 1 out");
const outArray2=op.outArray("Array 2 out");
const outArray3=op.outArray("Array 3 out");

var showingError = false;

const arr1=[];
const arr2=[];
const arr3=[];

inArray1.onChange = update;

function update()
{
    var array1=inArray1.get();

    if(!array1)
    {
        outArray1.set(null);
        return;
    }

    if(showingError)
    {
        showingError = false;
        op.uiAttr({error:null});
    }

    arr1.length = Math.floor(array1.length/3);
    arr2.length = Math.floor(array1.length/3);
    arr3.length = Math.floor(array1.length/3);

    for(var i=0;i<array1.length/3;i++)
    {
        arr1[i] = array1[i*3];
        arr2[i] = array1[i*3+1];
        arr3[i] = array1[i*3+2];
    }

    outArray1.set(null);
    outArray2.set(null);
    outArray3.set(null);
    outArray1.set(arr1);
    outArray2.set(arr2);
    outArray3.set(arr3);
}



};

Ops.Array.ArrayUnpack3.prototype = new CABLES.Op();
CABLES.OPS["fa671f66-6957-41e6-ac35-d615b7c29285"]={f:Ops.Array.ArrayUnpack3,objName:"Ops.Array.ArrayUnpack3"};




// **************************************************************
// 
// Ops.Anim.Timer2
// 
// **************************************************************

Ops.Anim.Timer2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const playPause=op.inValueBool("Play",true);
const reset=op.inTriggerButton("Reset");
const outTime=op.outValue("Time");
const inSpeed=op.inValue("Speed",1);

var timer=new CABLES.Timer();
var lastTime=0;
var time=0;

playPause.onChange=setState;
setState();

function setState()
{
    if(playPause.get())
    {
        timer.play();
        op.patch.addOnAnimFrame(op);
    }
    else
    {
        timer.pause();
        op.patch.removeOnAnimFrame(op);
    }
}

reset.onTriggered=function()
{
    time=0;
    lastTime=0;
    timer.setTime(0);
    outTime.set(0);
};

op.onAnimFrame=function()
{
    if(timer.isPlaying())
    {
        timer.update();
        if(lastTime===0)
        {
            lastTime=timer.get();
            return;
        }

        const t=timer.get()-lastTime;
        lastTime=timer.get();
        time+=t*inSpeed.get();
        if(time!=time)time=0;
        outTime.set(time);
    }
};


};

Ops.Anim.Timer2.prototype = new CABLES.Op();
CABLES.OPS["aac7f721-208f-411a-adb3-79adae2e471a"]={f:Ops.Anim.Timer2,objName:"Ops.Anim.Timer2"};




// **************************************************************
// 
// Ops.Math.Divide
// 
// **************************************************************

Ops.Math.Divide = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    number1 = op.inValueFloat("number1",1),
    number2 = op.inValueFloat("number2",1),
    result = op.outValue("result");

number1.onChange=number2.onChange=exec;
exec();

function exec()
{
    result.set( number1.get() / number2.get() );
}



};

Ops.Math.Divide.prototype = new CABLES.Op();
CABLES.OPS["86fcfd8c-038d-4b91-9820-a08114f6b7eb"]={f:Ops.Math.Divide,objName:"Ops.Math.Divide"};




// **************************************************************
// 
// Ops.Array.ContinuousNumberArray
// 
// **************************************************************

Ops.Array.ContinuousNumberArray = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};

var numValues=op.inValueInt("numValues");

var values=op.addOutPort(new CABLES.Port(op, "values",CABLES.OP_PORT_TYPE_ARRAY));
values.ignoreValueSerialize=true;

numValues.set(100);

numValues.onChange=init;

var arr=[];
init();

function init()
{
    arr.length=Math.abs(Math.floor(numValues.get())) || 100;
    for(var i=0;i<arr.length;i++)
    {
        arr[i]=i;
    }
    
    values.set(null);
    values.set(arr);
}


};

Ops.Array.ContinuousNumberArray.prototype = new CABLES.Op();
CABLES.OPS["8b9cdeea-f94c-41dc-b743-627115289226"]={f:Ops.Array.ContinuousNumberArray,objName:"Ops.Array.ContinuousNumberArray"};




// **************************************************************
// 
// Ops.Array.ArrayMath
// 
// **************************************************************

Ops.Array.ArrayMath = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
//this op expects 2 arrays. The user can then pick a
//mathematical function which will be applied to the
//two arrays. If arrays have a different length then a warning
//is given in the panel

const inArray_0 = op.inArray("array 0");
const inArray_1 = op.inArray("array 1");
const mathSelect = op.inValueSelect("Math function",['+','-','*','/','%','min','max'],'+');
const outArray = op.outArray("Array result");

//cache for errors
var showingError = false;
//create array to store multiplied result from both arrays
var mathArray = [];
var selectIndex = 0;
mathSelect.onChange = onFilterChange;

const MATH_FUNC_ADD = 0;
const MATH_FUNC_SUB = 1;
const MATH_FUNC_MUL = 2;
const MATH_FUNC_DIV = 3;
const MATH_FUNC_MOD = 4;
const MATH_FUNC_MIN = 5;
const MATH_FUNC_MAX = 6;

function onFilterChange()
{
    var mathSelectValue = mathSelect.get();
    if(mathSelectValue === '+') selectIndex = MATH_FUNC_ADD;
    else if(mathSelectValue === '-') selectIndex = MATH_FUNC_SUB;
    else if(mathSelectValue === '*') selectIndex = MATH_FUNC_MUL;
    else if(mathSelectValue === '/') selectIndex = MATH_FUNC_DIV;
    else if(mathSelectValue === '%') selectIndex = MATH_FUNC_MOD;
    else if(mathSelectValue === 'min') selectIndex = MATH_FUNC_MIN;
    else if(mathSelectValue === 'max') selectIndex = MATH_FUNC_MAX;
    update();
}

function update()
{
    var array0 = inArray_0.get();
    var array1 = inArray_1.get();
    //reset array
    mathArray.length = 0;
    //check if arrays come in correctly on startup
    if(!array0 || !array1)
    {
        return;
    }
    //if arrays don't have the same length then give a warning to panel ui
    if(array0.length !== array1.length)
    {
        if(!showingError)
        {
            op.uiAttr({error:"Arrays do not have the same length !"});
            showingError = true;
        }
        return;
    }
    if(showingError)
    {
        showingError = false;
        op.uiAttr({error:null});
    }


    mathArray.length = array0.length;

    //create variable for for loop
    var i = 0;
    //use selectIndex to decide which math mode is used on the 2 arrays
    if(selectIndex === MATH_FUNC_ADD)
    {
        for(i = 0; i < array0.length; i++)
            mathArray[i] = array0[i] + array1[i];
    }
    else if(selectIndex === MATH_FUNC_SUB)
    {
        for(i = 0; i < array0.length; i++)
            mathArray[i] = array0[i] - array1[i];
    }
    else if(selectIndex === MATH_FUNC_MUL)
    {
        for(i = 0; i < array0.length; i++)
            mathArray[i] = array0[i] * array1[i];
    }
    else if(selectIndex === MATH_FUNC_DIV)
    {
        for(i = 0; i < array0.length; i++)
            mathArray[i] = array0[i] / array1[i];
    }
    else if(selectIndex === MATH_FUNC_MOD)
    {
        for(i = 0; i < array0.length; i++)
            mathArray[i] = array0[i] % array1[i];
    }
    else if(selectIndex === MATH_FUNC_MIN)
    {
        for(i = 0; i < array0.length; i++)
            mathArray[i] = Math.min(array0[i], array1[i]);
    }
    else if(selectIndex === MATH_FUNC_MAX)
    {
        for(i = 0; i < array0.length; i++)
            mathArray[i] = Math.max(array0[i], array1[i]);
    }
    outArray.set(null);
    outArray.set(mathArray);
}

inArray_0.onChange = update;
inArray_1.onChange = update;
mathSelect.onChange = onFilterChange;
update();

};

Ops.Array.ArrayMath.prototype = new CABLES.Op();
CABLES.OPS["f31a1764-ce14-41de-9b3f-dc2fe249bb52"]={f:Ops.Array.ArrayMath,objName:"Ops.Array.ArrayMath"};




// **************************************************************
// 
// Ops.Array.ArrayModulo
// 
// **************************************************************

Ops.Array.ArrayModulo = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var inArray = op.inArray("Array In");
var inValue = op.inValue("Value",1.0);
var outArray = op.outArray("Array Out");

var newArr = [];
outArray.set(newArr);
inArray.onChange =
inValue.onChange = inArray.onChange = function()
{
    var arr = inArray.get();
    if(!arr)return;
    
    var modulo = inValue.get();
    
    if(newArr.length != arr.length)newArr.length = arr.length;
    
    var i = 0;
    for(i = 0;i < arr.length;i++)
    {
        newArr[i] = arr[i] % modulo;
    }
    outArray.set(null);
    outArray.set(newArr);
};

};

Ops.Array.ArrayModulo.prototype = new CABLES.Op();
CABLES.OPS["30a5568b-31da-4504-9525-578ee404993c"]={f:Ops.Array.ArrayModulo,objName:"Ops.Array.ArrayModulo"};




// **************************************************************
// 
// Ops.Array.ArraySubtract
// 
// **************************************************************

Ops.Array.ArraySubtract = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var inArray = op.inArray("Array In");
var inValue = op.inValue("Value",1.0);
var outArray = op.outArray("Array Out");

var newArr = [];
outArray.set(newArr);
inArray.onChange =
inValue.onChange = inArray.onChange = function()
{
    var arr = inArray.get();
    if(!arr)return;
    
    var subtract = inValue.get();
    
    if(newArr.length != arr.length)newArr.length = arr.length;
    
    var i = 0;
    for(i = 0;i < arr.length;i++)
    {
        newArr[i] = arr[i] - subtract;
    }
    outArray.set(null);
    outArray.set(newArr);
};

};

Ops.Array.ArraySubtract.prototype = new CABLES.Op();
CABLES.OPS["af78ab59-75d5-4ead-9a8d-27a63e1cbf3f"]={f:Ops.Array.ArraySubtract,objName:"Ops.Array.ArraySubtract"};




// **************************************************************
// 
// Ops.Gl.Shader.PointMaterial
// 
// **************************************************************

Ops.Gl.Shader.PointMaterial = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={shader_frag:"\n{{MODULES_HEAD}}\n\nIN vec2 texCoord;\n#ifdef HAS_TEXTURES\n\n   #ifdef HAS_TEXTURE_DIFFUSE\n       UNI sampler2D diffTex;\n   #endif\n   #ifdef HAS_TEXTURE_MASK\n       UNI sampler2D texMask;\n   #endif\n#endif\nUNI float r;\nUNI float g;\nUNI float b;\nUNI float a;\n\n\n\nvoid main()\n{\n    {{MODULE_BEGIN_FRAG}}\n\n    vec4 col=vec4(r,g,b,a);\n\n    #ifdef HAS_TEXTURES\n\n        #ifdef HAS_TEXTURE_MASK\n            float mask=texture(texMask,vec2(gl_PointCoord.x,(1.0-gl_PointCoord.y))).r;\n        #endif\n\n        #ifdef HAS_TEXTURE_DIFFUSE\n\n            #ifdef LOOKUP_TEXTURE\n                col=texture(diffTex,texCoord);\n            #endif\n            #ifndef LOOKUP_TEXTURE\n                col=texture(diffTex,vec2(gl_PointCoord.x,(1.0-gl_PointCoord.y)));\n            #endif\n\n            #ifdef COLORIZE_TEXTURE\n              col.r*=r;\n              col.g*=g;\n              col.b*=b;\n            #endif\n        #endif\n        col.a*=a;\n    #endif\n\n    {{MODULE_COLOR}}\n\n    #ifdef MAKE_ROUND\n        if ((gl_PointCoord.x-0.5)*(gl_PointCoord.x-0.5) + (gl_PointCoord.y-0.5)*(gl_PointCoord.y-0.5) > 0.25) discard; //col.a=0.0;\n    #endif\n\n    #ifdef HAS_TEXTURE_MASK\n        col.a=mask;\n    #endif\n\n\n    // #ifdef RANDOMIZE_COLOR\n        // col.rgb*=fract(sin(dot(texCoord.xy ,vec2(12.9898,78.233))) * 43758.5453);\n    // #endif\n\n\n\n    outColor = col;\n}\n",shader_vert:"{{MODULES_HEAD}}\nIN vec3 vPosition;\nIN vec2 attrTexCoord;\n\nOUT vec3 norm;\n#ifdef HAS_TEXTURES\n    OUT vec2 texCoord;\n#endif\n\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\n\nUNI float pointSize;\nUNI vec3 camPos;\n\nUNI float canvasWidth;\nUNI float canvasHeight;\nUNI float camDistMul;\n\nUNI float randomSize;\n\nIN float attrVertIndex;\n\n\nfloat rand(float n){return fract(sin(n) * 43758.5453123);}\n\n#define POINTMATERIAL\n\nvoid main()\n{\n    float psMul=sqrt(canvasWidth/canvasHeight)+0.00000000001;\n    float sizeMultiply=1.0;\n\n\n\n    #ifdef HAS_TEXTURES\n        texCoord=attrTexCoord;\n    #endif\n\n    mat4 mMatrix=modelMatrix;\n\n    vec4 pos = vec4( vPosition, 1. );\n\n    {{MODULE_VERTEX_POSITION}}\n\n    vec4 model=mMatrix * pos;\n\n    psMul+=rand(attrVertIndex)*randomSize;\n\n    psMul*=sizeMultiply;\n\n    #ifndef SCALE_BY_DISTANCE\n        gl_PointSize = pointSize * psMul;\n    #endif\n    #ifdef SCALE_BY_DISTANCE\n        float cameraDist = distance(model.xyz, camPos);\n        gl_PointSize = (pointSize / cameraDist) * psMul;\n    #endif\n\n\n\n\n\n    gl_Position = projMatrix * viewMatrix * model;\n\n\n}\n",};
const cgl=op.patch.cgl;

var render=op.addInPort(new CABLES.Port(op,"render",CABLES.OP_PORT_TYPE_FUNCTION) );
var trigger=op.outTrigger('trigger');
var shaderOut=op.addOutPort(new CABLES.Port(op,"shader",CABLES.OP_PORT_TYPE_OBJECT));

var pointSize=op.addInPort(new CABLES.Port(op,"PointSize",CABLES.OP_PORT_TYPE_VALUE));
var randomSize=op.inValue("Random Size",3);

var makeRound=op.addInPort(new CABLES.Port(op,"Round",CABLES.OP_PORT_TYPE_VALUE,{ display:'bool' }));
var doScale=op.addInPort(new CABLES.Port(op,"Scale by Distance",CABLES.OP_PORT_TYPE_VALUE,{ display:'bool' }));
var r=op.addInPort(new CABLES.Port(op,"r",CABLES.OP_PORT_TYPE_VALUE,{ display:'range',colorPick:'true' }));
var g=op.addInPort(new CABLES.Port(op,"g",CABLES.OP_PORT_TYPE_VALUE,{ display:'range' }));
var b=op.addInPort(new CABLES.Port(op,"b",CABLES.OP_PORT_TYPE_VALUE,{ display:'range' }));
var a=op.addInPort(new CABLES.Port(op,"a",CABLES.OP_PORT_TYPE_VALUE,{ display:'range' }));
var preMultipliedAlpha=op.addInPort(new CABLES.Port(op,"preMultiplied alpha",CABLES.OP_PORT_TYPE_VALUE,{ display:'bool' }));


makeRound.set(true);
doScale.set(false);
pointSize.set(3);


var shader=new CGL.Shader(cgl,'PointMaterial');
shader.setModules(['MODULE_VERTEX_POSITION','MODULE_COLOR','MODULE_BEGIN_FRAG']);

shader.define('MAKE_ROUND');

var uniPointSize=new CGL.Uniform(shader,'f','pointSize',pointSize);
var uniRandomSize=new CGL.Uniform(shader,'f','randomSize',randomSize);


shaderOut.set(shader);
shader.setSource(attachments.shader_vert,attachments.shader_frag);
shader.glPrimitive=cgl.gl.POINTS;
shader.bindTextures=bindTextures;
shaderOut.ignoreValueSerialize=true;

r.set(Math.random());
g.set(Math.random());
b.set(Math.random());
a.set(1.0);

r.uniform=new CGL.Uniform(shader,'f','r',r);
g.uniform=new CGL.Uniform(shader,'f','g',g);
b.uniform=new CGL.Uniform(shader,'f','b',b);
a.uniform=new CGL.Uniform(shader,'f','a',a);

var uniWidth=new CGL.Uniform(shader,'f','canvasWidth',cgl.canvasWidth);
var uniHeight=new CGL.Uniform(shader,'f','canvasHeight',cgl.canvasHeight);

render.onTriggered=doRender;

var texture=op.inTexture("texture");
var textureUniform=null;

var textureMask=op.inTexture("Texture Mask");
var textureMaskUniform=null;

op.preRender=function()
{
    if(shader)shader.bind();
    doRender();
};

function bindTextures()
{
    if(texture.get()) cgl.setTexture(0,texture.get().tex);
    if(textureMask.get()) cgl.setTexture(1,textureMask.get().tex);
}

function doRender()
{
    uniWidth.setValue(cgl.canvasWidth);
    uniHeight.setValue(cgl.canvasHeight);

    cgl.setShader(shader);
    bindTextures();
    if(preMultipliedAlpha.get())cgl.gl.blendFunc(cgl.gl.ONE, cgl.gl.ONE_MINUS_SRC_ALPHA);

    trigger.trigger();
    if(preMultipliedAlpha.get())cgl.gl.blendFunc(cgl.gl.SRC_ALPHA,cgl.gl.ONE_MINUS_SRC_ALPHA);

    cgl.setPreviousShader();
}

doScale.onChange=function()
{
    if(doScale.get()) shader.define('SCALE_BY_DISTANCE');
        else shader.removeDefine('SCALE_BY_DISTANCE');
};

makeRound.onChange=function()
{
    if(makeRound.get()) shader.define('MAKE_ROUND');
        else shader.removeDefine('MAKE_ROUND');
};

texture.onChange=function()
{
    if(texture.get())
    {
        if(textureUniform!==null)return;
        shader.removeUniform('diffTex');
        shader.define('HAS_TEXTURE_DIFFUSE');
        textureUniform=new CGL.Uniform(shader,'t','diffTex',0);
    }
    else
    {
        shader.removeUniform('diffTex');
        shader.removeDefine('HAS_TEXTURE_DIFFUSE');
        textureUniform=null;
    }
};

textureMask.onChange=function()
{
    if(textureMask.get())
    {
        if(textureMaskUniform!==null)return;
        shader.removeUniform('texMask');
        shader.define('HAS_TEXTURE_MASK');
        textureMaskUniform=new CGL.Uniform(shader,'t','texMask',1);
    }
    else
    {
        shader.removeUniform('texMask');
        shader.removeDefine('HAS_TEXTURE_MASK');
        textureMaskUniform=null;
    }
};

var colorizeTexture=op.addInPort(new CABLES.Port(op,"colorizeTexture",CABLES.OP_PORT_TYPE_VALUE,{ display:'bool' }));
colorizeTexture.set(false);
colorizeTexture.onChange=function()
{
    if(colorizeTexture.get()) shader.define('COLORIZE_TEXTURE');
        else shader.removeDefine('COLORIZE_TEXTURE');
};

var textureLookup=op.addInPort(new CABLES.Port(op,"texture Lookup",CABLES.OP_PORT_TYPE_VALUE,{ display:'bool' }));
textureLookup.set(false);
textureLookup.onChange=function()
{
    if(textureLookup.get()) shader.define('LOOKUP_TEXTURE');
        else shader.removeDefine('LOOKUP_TEXTURE');
};



};

Ops.Gl.Shader.PointMaterial.prototype = new CABLES.Op();
CABLES.OPS["f86a4a07-00ee-4f68-8839-e02d51d1cd2f"]={f:Ops.Gl.Shader.PointMaterial,objName:"Ops.Gl.Shader.PointMaterial"};




// **************************************************************
// 
// Ops.Array.ArrayPack3
// 
// **************************************************************

Ops.Array.ArrayPack3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const exe = op.inTrigger("Trigger in");
const inArr1=op.inArray("Array 1");
const inArr2=op.inArray("Array 2");
const inArr3=op.inArray("Array 3");

const outArr=op.outArray("Array out");
const outNum=op.outValue("Num Points");

var showingError = false;

var arr=[];

exe.onTriggered = update;


function update()
{
    var array1=inArr1.get();
    var array2=inArr2.get();
    var array3=inArr3.get();

    if(!array1 || !array2 || !array3 )
    {
        outArr.set(null);
        return;
    }

    if((array1.length !== array2.length) || (array2.length !== array3.length))
    {
        if(!showingError)
        {
            op.uiAttr({error:"Arrays do not have the same length !"});
            showingError = true;
        }
        return;
    }

    if(showingError)
    {
        showingError = false;
        op.uiAttr({error:null});
    }

    arr.length = array1.length;
    for(var i=0;i<array1.length;i++)
    {
        arr[i*3+0] = array1[i];
        arr[i*3+1] = array2[i];
        arr[i*3+2] = array3[i];

    }

    outArr.set(null);
    outArr.set(arr);
    outNum.set(arr.length/3);
}



};

Ops.Array.ArrayPack3.prototype = new CABLES.Op();
CABLES.OPS["2bcf32fe-3cbd-48fd-825a-61255bebda9b"]={f:Ops.Array.ArrayPack3,objName:"Ops.Array.ArrayPack3"};




// **************************************************************
// 
// Ops.Gl.Meshes.PointCloudFromArray
// 
// **************************************************************

Ops.Gl.Meshes.PointCloudFromArray = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};

const
    exe=op.inTrigger("exe"),
    arr=op.inArray("Array"),
    numPoints=op.inValueInt("Num Points"),
    outGeom=op.outObject("Geometry"),
    pTexCoordRand=op.inValueBool("Scramble Texcoords",true),
    seed=op.inValue("Seed");

const cgl=op.patch.cgl;

pTexCoordRand.onChange=updateRandTexCoords;
seed.onChange=arr.onChange=reset;
numPoints.onChange=updateNumVerts;

var hasError=false;

exe.onTriggered=doRender;

var mesh=null;
const geom=new CGL.Geometry("pointcloudfromarray");
var texCoords=[];
var needsRebuild=true;

function doRender()
{
    if(CABLES.UI)
    {
        var shader=cgl.getShader();
        if(shader && shader.glPrimitive!=cgl.gl.POINTS)
        {
            if(!hasError)
            {
                op.uiAttr( { 'warning': 'using a Material not made for point rendering. maybe use pointMaterial.' } );
                hasError=true;
            }
            return;
        }
        if(hasError)
        {
            op.uiAttr({'warning':null});
            hasError=false;
        }
    }

    if(needsRebuild || !mesh)rebuild();
    if(mesh) mesh.render(cgl.getShader());
}

function reset()
{
    needsRebuild=true;
}

function updateRandTexCoords()
{
    if(!pTexCoordRand.get()) seed.setUiAttribs({hidePort:true,greyout:true});
        else seed.setUiAttribs({hidePort:false,greyout:false});
    needsRebuild=true;
}

function updateNumVerts()
{
    if(mesh)
    {
        mesh.setNumVertices( Math.min(geom.vertices.length/3,numPoints.get()));
        if(numPoints.get()==0)mesh.setNumVertices(geom.vertices.length/3);
    }
}

function rebuild()
{
    var verts=arr.get();
    if(!verts)return;

    geom.clear();
    var num=verts.length/3;
    num=Math.abs(Math.floor(num));

    if(!texCoords || texCoords.length!=num*2) texCoords.length=num*2;//=new Float32Array(num*2);

    var changed=false;
    var rndTc=pTexCoordRand.get();

    Math.randomSeed=seed.get();

    for(var i=0;i<num;i++)
    {
        if(geom.vertices[i*3]!=verts[i*3] ||
            geom.vertices[i*3+1]!=verts[i*3+1] ||
            geom.vertices[i*3+2]!=verts[i*3+2])
        {
            if(rndTc)
            {
                texCoords[i*2]=Math.seededRandom();
                texCoords[i*2+1]=Math.seededRandom();
            }
            else
            {
                texCoords[i*2]=i/num;
                texCoords[i*2+1]=i/num;
            }
            changed=true;
        }
    }

    if(changed)
    {
        geom.setPointVertices(verts);
        geom.setTexCoords(texCoords);
        geom.verticesIndices=[];

        if(mesh)mesh.dispose();
        mesh=new CGL.Mesh(cgl,geom,cgl.gl.POINTS);

        mesh.addVertexNumbers=true;
        mesh.setGeom(geom);
        outGeom.set(geom);
    }

    updateNumVerts();
    needsRebuild=false;
}


};

Ops.Gl.Meshes.PointCloudFromArray.prototype = new CABLES.Op();
CABLES.OPS["0a6d9c6f-6459-45ca-88ad-268a1f7304db"]={f:Ops.Gl.Meshes.PointCloudFromArray,objName:"Ops.Gl.Meshes.PointCloudFromArray"};




// **************************************************************
// 
// Ops.Gl.ClearColor
// 
// **************************************************************

Ops.Gl.ClearColor = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    render=op.inTrigger("render"),
    trigger=op.outTrigger("trigger"),
    r=op.inValueSlider("r",0.1),
    g=op.inValueSlider("g",0.1),
    b=op.inValueSlider("b",0.1),
    a=op.inValueSlider("a",1);

r.setUiAttribs({ colorPick: true });

const cgl=op.patch.cgl;

render.onTriggered=function()
{
    cgl.gl.clearColor(r.get(),g.get(),b.get(),a.get());
    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
    trigger.trigger();
};


};

Ops.Gl.ClearColor.prototype = new CABLES.Op();
CABLES.OPS["19b441eb-9f63-4f35-ba08-b87841517c4d"]={f:Ops.Gl.ClearColor,objName:"Ops.Gl.ClearColor"};




// **************************************************************
// 
// Ops.Color.HexToRGB2
// 
// **************************************************************

Ops.Color.HexToRGB2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    hex=op.inString("Hex","#ff0000"),
    asBytes=op.inValueBool("Bytes"),
    outR=op.outValue("R"),
    outG=op.outValue("G"),
    outB=op.outValue("B");

function hexToR(h) {
    return parseInt((cutHex(h)).substring(0,2),16)||0;
}
function hexToG(h) {
    return parseInt((cutHex(h)).substring(2,4),16)||0;
}
function hexToB(h) {
    return parseInt((cutHex(h)).substring(4,6),16)||0;
}
function cutHex(h) {
    return (h.charAt(0)=="#") ? h.substring(1,7):h;
}


hex.onChange=parse;
asBytes.onChange=parse;

function parse()
{
    var str=hex.get()||'';
    var r=hexToR(str);
    var g=hexToG(str);
    var b=hexToB(str);


    if(!asBytes.get())
    {
        r/=255;
        g/=255;
        b/=255;
    }

    outR.set(r);
    outB.set(b);
    outG.set(g);
}

};

Ops.Color.HexToRGB2.prototype = new CABLES.Op();
CABLES.OPS["9877f198-8dac-48e5-9310-244ef1a8dec5"]={f:Ops.Color.HexToRGB2,objName:"Ops.Color.HexToRGB2"};




// **************************************************************
// 
// Ops.Math.Compare.Greater
// 
// **************************************************************

Ops.Math.Compare.Greater = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    result=op.outValue("result"),
    number1=op.inValueFloat("number1"),
    number2=op.inValueFloat("number2");

number1.onChange=number2.onChange=exec;

function exec()
{
    result.set(number1.get()>number2.get());
}



};

Ops.Math.Compare.Greater.prototype = new CABLES.Op();
CABLES.OPS["b250d606-f7f8-44d3-b099-c29efff2608a"]={f:Ops.Math.Compare.Greater,objName:"Ops.Math.Compare.Greater"};




// **************************************************************
// 
// Ops.Gl.CanvasSize
// 
// **************************************************************

Ops.Gl.CanvasSize = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};


var width=op.addOutPort(new CABLES.Port(op,"width",CABLES.OP_PORT_TYPE_VALUE));
var height=op.addOutPort(new CABLES.Port(op,"height",CABLES.OP_PORT_TYPE_VALUE));
var pixelRatio=op.outValue("Pixel Ratio");
var aspect=op.outValue("Aspect Ratio");

var cgl=op.patch.cgl;
cgl.addEventListener("resize",update);
update();

function update()
{
    height.set(cgl.canvasHeight);
    width.set(cgl.canvasWidth);
    pixelRatio.set(window.devicePixelRatio);
    aspect.set(cgl.canvasWidth/cgl.canvasHeight);
}


};

Ops.Gl.CanvasSize.prototype = new CABLES.Op();
CABLES.OPS["94e499e5-b4ee-4861-ab48-6ab5098b2cc3"]={f:Ops.Gl.CanvasSize,objName:"Ops.Gl.CanvasSize"};




// **************************************************************
// 
// Ops.Boolean.And
// 
// **************************************************************

Ops.Boolean.And = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    bool0=op.inValueBool("bool 1"),
    bool1=op.inValueBool("bool 2"),
    result=op.outValueBool("result");

bool0.onChange=exec;
bool1.onChange=exec;

function exec()
{
    result.set( bool1.get() && bool0.get() );
}

};

Ops.Boolean.And.prototype = new CABLES.Op();
CABLES.OPS["c26e6ce0-8047-44bb-9bc8-5a4f911ed8ad"]={f:Ops.Boolean.And,objName:"Ops.Boolean.And"};




// **************************************************************
// 
// Ops.Html.AppendChild
// 
// **************************************************************

Ops.Html.AppendChild = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
// constants
var CANVAS_ELEMENT = op.patch.cgl.canvas;

// variables
var lastParent = null;
var lastChild = null;

// inputs
var parentPort = op.inObject('Parent');
var childPort = op.inObject('Child');

// outputs
var parentOutPort = op.outObject('Parent Out');
var childOutPort = op.outObject('Child Out');

// change listeners
parentPort.onChange = update;
childPort.onChange = update;

// functions

function update() {
    var parent = parentPort.get();
    var child = childPort.get();
    if(parent !== lastParent) {
        if(parent) {
            handleParentConnect(parent, child);
        } else {
            handleParentDisconnect(parent, child);
        }
        lastParent = parent;
    }
    if(child !== lastChild) {
        if(child) {
            handleChildConnect(parent, child);
        } else {
            handleChildDisconnect(parent, child);
        }
        lastChild = child;
    }
    parentOutPort.set(parent);
    childOutPort.set(child);
}

function handleParentConnect(parent, child) {
    if(child) {
        parent.appendChild(child);
    }    
}

function handleParentDisconnect(parent, child) {
    if(child) {
        CANVAS_ELEMENT.appendChild(child); // if there is no parent, append to patch
    }
}

function handleChildConnect(parent, child) {
    if(parent) {
        parent.appendChild(child);
    }    
}

function handleChildDisconnect(parent, child) {
    if(lastChild) {
        CANVAS_ELEMENT.appendChild(lastChild);    
    }
}


};

Ops.Html.AppendChild.prototype = new CABLES.Op();
CABLES.OPS["dbb2b232-3021-4eb7-bf9b-d194ae8918cb"]={f:Ops.Html.AppendChild,objName:"Ops.Html.AppendChild"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.BarrelDistortion
// 
// **************************************************************

Ops.Gl.TextureEffects.BarrelDistortion = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={barreldistort_frag:"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI float amount;\n\n// adapted from https://www.shadertoy.com/view/MlSXR3\n\n\nvec2 brownConradyDistortion(vec2 uv)\n{\n// positive values of K1 give barrel distortion, negative give pincushion\n    float barrelDistortion1 = 0.15-amount; // K1 in text books\n    float barrelDistortion2 = 0.0-amount; // K2 in text books\n    float r2 = uv.x*uv.x + uv.y*uv.y;\n    uv *= 1.0 + barrelDistortion1 * r2 + barrelDistortion2 * r2 * r2;\n\n    // tangential distortion (due to off center lens elements)\n    // is not modeled in this function, but if it was, the terms would go here\n    return uv;\n}\n\nvoid main()\n{\n   vec2 tc=brownConradyDistortion(texCoord-0.5)+0.5;\n   vec4 col=texture(tex,tc);\n   outColor= col;\n}",};
var render=op.inTrigger('render');
var amount=op.inValue("amount");

var trigger=op.outTrigger('trigger');

var cgl=op.patch.cgl;
var shader=new CGL.Shader(cgl);

shader.setSource(shader.getDefaultVertexShader(),attachments.barreldistort_frag);
var textureUniform=new CGL.Uniform(shader,'t','tex',0);
var uniamount=new CGL.Uniform(shader,'f','amount',0);


render.onTriggered=function()
{

    var texture=cgl.currentTextureEffect.getCurrentSourceTexture();

    uniamount.setValue(amount.get()*(1/texture.width));

    cgl.setShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, texture.tex );
    // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, texture.tex );

    cgl.currentTextureEffect.finish();
    cgl.setPreviousShader();

    trigger.trigger();
};


};

Ops.Gl.TextureEffects.BarrelDistortion.prototype = new CABLES.Op();
CABLES.OPS["57eda803-bda4-4b22-b578-608cabb9859e"]={f:Ops.Gl.TextureEffects.BarrelDistortion,objName:"Ops.Gl.TextureEffects.BarrelDistortion"};




// **************************************************************
// 
// Ops.Value.ValueToggle
// 
// **************************************************************

Ops.Value.ValueToggle = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
// inputs
var value0port = op.inValue("Value 0", 0);
var value1port = op.inValue("Value 1", 1);
var useValue1Port = op.inValueBool("Use Value 1", false);

// outputs
var outValuePort = op.outValue("Out Value", 0);

// functions
function setOutput() {
    var useValue1 = useValue1Port.get();
    if(useValue1) {
        outValuePort.set(value1port.get());
    } else {
        outValuePort.set(value0port.get());
    }
}

// change listeners
value0port.onChange = setOutput;
value1port.onChange = setOutput;
useValue1Port.onChange = setOutput;

};

Ops.Value.ValueToggle.prototype = new CABLES.Op();



