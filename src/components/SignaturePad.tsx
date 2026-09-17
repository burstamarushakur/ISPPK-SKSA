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

  const fitCanvas = () => {
    const canvas=canvasRef.current
    if(!canvas) return
    const rect=canvas.getBoundingClientRect()
    const ratio=Math.max(window.devicePixelRatio||1,1)
    const width=Math.max(300,Math.round(rect.width*ratio))
    const height=Math.max(160,Math.round(190*ratio))
    if(canvas.width===width && canvas.height===height) return
    canvas.width=width; canvas.height=height
    const ctx=canvas.getContext('2d')
    if(ctx){ctx.scale(ratio,ratio);ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=2.2;ctx.strokeStyle='#1d1a24'}
    if(value){
      const img=new Image();img.onload=()=>ctx?.drawImage(img,0,0,rect.width,190);img.src=value
    }
  }

  useEffect(()=>{fitCanvas();const onResize=()=>fitCanvas();window.addEventListener('resize',onResize);return()=>window.removeEventListener('resize',onResize)},[])
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return
    const rect=canvas.getBoundingClientRect();const ctx=canvas.getContext('2d');if(!ctx)return
    ctx.clearRect(0,0,rect.width,190)
    if(value){const img=new Image();img.onload=()=>ctx.drawImage(img,0,0,rect.width,190);img.src=value;setHasInk(true)}else setHasInk(false)
  },[value])

  const point=(e:React.PointerEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
  const start=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(disabled)return;e.currentTarget.setPointerCapture(e.pointerId);drawingRef.current=true;lastRef.current=point(e)}
  const move=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(disabled||!drawingRef.current)return;const ctx=e.currentTarget.getContext('2d');const last=lastRef.current;const p=point(e);if(ctx&&last){ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();setHasInk(true)}lastRef.current=p}
  const finish=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(disabled||!drawingRef.current)return;drawingRef.current=false;lastRef.current=null;try{onChange(e.currentTarget.toDataURL('image/png'))}catch{}}
  const clear=()=>{if(disabled)return;const c=canvasRef.current;if(c){const ctx=c.getContext('2d');ctx?.clearRect(0,0,c.width,c.height)}setHasInk(false);onChange('')}

  return <div className="signature-pad-wrap">
    <canvas ref={canvasRef} className={`signature-pad${disabled?' disabled':''}`} onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} aria-label="Pad tandatangan digital" />
    <div className="signature-pad-footer"><span className="helper">{hasInk?'Tandatangan direkod.':'Tandatangan menggunakan mouse, jari atau stylus.'}</span><button type="button" className="btn btn-secondary" onClick={clear} disabled={disabled||!hasInk}>Padam Tandatangan</button></div>
  </div>
}
