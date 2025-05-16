import { React, useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import CheckAuth from './CheckAuth'

export const ProtectedRoute = () => {
  const [DOM, setDOM] = useState(<></>)
  const navigate = useNavigate()

  useEffect(() => {
    CheckAuth().then(function (auth) {
      if (typeof auth == Object) {
        auth = auth[0]
      }

      if (!auth) {
        navigate('/login')
      }

      setDOM(<Outlet />)
    })
  }, [])

  return DOM
}
