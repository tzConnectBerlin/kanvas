import './App.css'
import 'animate.css/animate.min.css'
import 'react-toastify/dist/ReactToastify.css'
import Router from './router'
import styled from '@emotion/styled'
import './assets/i18n/config'
import { Suspense } from 'react'
import { ToastContainer, cssTransition } from 'react-toastify'

const StyledToastContainer = styled(ToastContainer)`
    margin-top: 5rem !important;
    margin-right: 1rem !important;

    .Toastify__toast {
        margin-right: 1rem !important;
        border-radius: 1rem;
        min-height: 5rem;
        min-width: 20rem;
    }
`

export const fade = cssTransition({
    enter: 'animate__animated animate__fadeIn',
    exit: 'animate__animated animate__fadeOut',
})

function App() {
    return (
        <Suspense fallback={<p>loading...</p>}>
            <Router />
            <StyledToastContainer transition={fade} />
        </Suspense>
    )
}

export default App
