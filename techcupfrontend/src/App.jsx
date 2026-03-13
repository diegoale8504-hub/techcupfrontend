import { useState } from "react";
import "./App.css";

function App() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Estudiante");
  const [type, setType] = useState("institucional");

  const handleLogin = (e) => {
    e.preventDefault();
    console.log({ email, password, role, type });
  };

  return (
    <>
      <div className="container">

        <div className="title">
          <h1>TECHCUP</h1>
          <h3>FÚTBOL</h3>
          <p>ESCUELA COLOMBIANA DE INGENIERÍA</p>
        </div>

        <div className="card">

          <div className="tabs">
            <button
              className={type === "institucional" ? "active" : ""}
              onClick={() => setType("institucional")}
            >
              🏫 Institucional
            </button>

            <button
              className={type === "gmail" ? "active" : ""}
              onClick={() => setType("gmail")}
            >
              📧 Gmail (Familiar)
            </button>
          </div>

          <form onSubmit={handleLogin}>

            <label>Correo electrónico</label>
            <input
              type="email"
              placeholder="usuario@mail.escuelaing.edu.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label>Contraseña</label>
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

           

            <label>Demo: ingresar como</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option>Estudiante</option>
              <option>Administrador</option>
              <option>Organizador</option>
            </select>

            <button className="loginBtn">
              Ingresar al sistema
            </button>

          </form>

          <p className="register">
            ¿No tienes cuenta? <span>Registrate aquí</span>
          </p>

          <a className="link" href="#">
            Ver todas las excepciones de sesión →
          </a>

        </div>

        <button className="navBtn">☰ Navegar</button>

      </div>
    </>
  );
}

export default App;