import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import TeacherForm from './pages/TeacherForm'
import Pic from './pages/Pic'
import RecordEditor from './pages/RecordEditor'

export default function App(){
  return <BrowserRouter><Routes><Route element={<Layout/>}><Route path="/" element={<Home/>}/><Route path="/borang" element={<TeacherForm/>}/><Route path="/pic" element={<Pic/>}/><Route path="/pic/rekod/:id" element={<RecordEditor/>}/></Route></Routes></BrowserRouter>
}
