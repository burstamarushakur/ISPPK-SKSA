import { useEffect, useRef, useState } from 'react'

type Props = {
  value: string
  onChange: (dataUrl: string) => void
  disabled?: boolean
}

export default function SignaturePad({ value, onChange, disabled=false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const lastRef = useRef<{x:number,y:number}|null>(null)
  const [hasInk,setHasInk]=useState(Boolean(value))

  const configureContext=(canvas:HTMLCanvasElement,ratio:number)=>{
    const ctx=canvas.getContext('2d')
    if(ctx){ctx.setTransform(ratio,0,0,ratio,0,0);ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=2.2;ctx.strokeStyle='#1d1a24'}
    return ctx
  }

  const drawSaved=(canvas:HTMLCanvasElement,src:string)=>{
    if(!src)return
    const rect=canvas.getBoundingClientRect();const ctx=canvas.getContext('2d');if(!ctx)return
    const img=new Image()
    img.onload=()=>{
      const pad=12
      const scale=Math.min((rect.width-pad*2)/img.width,(190-pad*2)/img.height)
      const w=img.width*scale,h=img.height*scale
      ctx.drawImage(img,(rect.width-w)/2,(190-h)/2,w,h)
    }
    img.src=src
  }

  const fitCanvas = () => {
    const canvas=canvasRef.current
    if(!canvas) return
    const rect=canvas.getBoundingClientRect()
    const ratio=Math.max(window.devicePixelRatio||1,1)
    const width=Math.max(300,Math.round(rect.width*ratio))
    const height=Math.max(160,Math.round(190*ratio))
    if(canvas.width===width && canvas.height===height) return
    canvas.width=width; canvas.height=height
    configureContext(canvas,ratio)
    if(value) drawSaved(canvas,value)
  }

  useEffect(()=>{fitCanvas();const onResize=()=>fitCanvas();window.addEventListener('resize',onResize);return()=>window.removeEventListener('resize',onResize)},[])
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return
    const ratio=Math.max(window.devicePixelRatio||1,1)
    const ctx=configureContext(canvas,ratio);if(!ctx)return
    ctx.clearRect(0,0,canvas.width/ratio,canvas.height/ratio)
    if(value){drawSaved(canvas,value);setHasInk(true)}else setHasInk(false)
  },[value])

  const point=(e:React.PointerEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
  const start=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(disabled)return;e.currentTarget.setPointerCapture(e.pointerId);drawingRef.current=true;lastRef.current=point(e)}
  const move=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(disabled||!drawingRef.current)return;const ctx=e.currentTarget.getContext('2d');const last=lastRef.current;const p=point(e);if(ctx&&last){ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();setHasInk(true)}lastRef.current=p}

  // Export hanya piksel dakwat dengan latar alpha telus. CSS putih pada pad hanyalah
  // untuk paparan dan tidak pernah dimasukkan ke PNG yang disimpan.
  const transparentPng=(canvas:HTMLCanvasElement)=>{
    const ctx=canvas.getContext('2d');if(!ctx)return canvas.toDataURL('image/png')
    const {width,height}=canvas
    const data=ctx.getImageData(0,0,width,height)
    let minX=width,minY=height,maxX=-1,maxY=-1
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      if(data.data[(y*width+x)*4+3]>8){if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y}
    }
    if(maxX<0||maxY<0)return ''
    const pad=Math.max(8,Math.round((window.devicePixelRatio||1)*8))
    minX=Math.max(0,minX-pad);minY=Math.max(0,minY-pad);maxX=Math.min(width-1,maxX+pad);maxY=Math.min(height-1,maxY+pad)
    const w=maxX-minX+1,h=maxY-minY+1
    const out=document.createElement('canvas');out.width=w;out.height=h
    const outCtx=out.getContext('2d');if(!outCtx)return canvas.toDataURL('image/png')
    outCtx.putImageData(ctx.getImageData(minX,minY,w,h),0,0)
    return out.toDataURL('image/png')
  }

  const finish=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(disabled||!drawingRef.current)return;drawingRef.current=false;lastRef.current=null;try{onChange(transparentPng(e.currentTarget))}catch{}}
  const clear=()=>{if(disabled)return;const c=canvasRef.current;if(c){const ctx=c.getContext('2d');ctx?.clearRect(0,0,c.width,c.height)}setHasInk(false);onChange('')}

  return <div className="signature-pad-wrap">
    <canvas ref={canvasRef} className={`signature-pad${disabled?' disabled':''}`} onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} aria-label="Pad tandatangan digital" />
    <div className="signature-pad-footer"><span className="helper">{hasInk?'Tandatangan direkod sebagai PNG telus.':'Tandatangan menggunakan mouse, jari atau stylus.'}</span><button type="button" className="btn btn-secondary" onClick={clear} disabled={disabled||!hasInk}>Padam Tandatangan</button></div>
  </div>
}
