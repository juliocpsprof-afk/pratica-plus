"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { generateStudentAccess } from "@/services/auth.service";
import { getClasses, ClassRow } from "@/services/classes.service";
import { getCourses, CourseRow } from "@/services/courses.service";
import { createStudent } from "@/services/students.service";

type ImportedStudent = {
  fullName: string;
  username: string;
  password: string;
  status: "pendente" | "importado" | "erro";
  message?: string;
};

function parseCsv(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(";")[0]?.split(",")[0]?.trim() ?? "")
    .filter(Boolean);
}

function normalizeHeaderOrName(value: string): string {
  return value.trim().replace(/^nome completo$/i, "").trim();
}

export function ImportStudentsManager() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [courseId, setCourseId] = useState("");
  const [classId, setClassId] = useState("");
  const [students, setStudents] = useState<ImportedStudent[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  async function loadData() {
    try {
      const [coursesData, classesData] = await Promise.all([
        getCourses(),
        getClasses(),
      ]);

      setCourses(coursesData);
      setClasses(classesData);

      if (!courseId && coursesData[0]) {
        setCourseId(coursesData[0].id);
      }

      if (!classId && classesData[0]) {
        setClassId(classesData[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar cursos e turmas."
      );
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleFileUpload(file: File) {
    try {
      setError("");
      setSuccessMessage("");

      const extension = file.name.split(".").pop()?.toLowerCase();
      let names: string[] = [];

      if (extension === "csv") {
        const text = await file.text();
        names = parseCsv(text);
      } else if (extension === "xlsx" || extension === "xls") {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
          header: 1,
        }) as unknown[][];

        names = rows
          .map((row) => String(row[0] ?? "").trim())
          .filter(Boolean);
      } else {
        setError("Formato inválido. Envie arquivo .csv, .xlsx ou .xls.");
        return;
      }

      const generated = names
        .map(normalizeHeaderOrName)
        .filter((name) => name.split(/\s+/).length >= 2)
        .map((name) => {
          const access = generateStudentAccess(name);

          return {
            fullName: access.fullName,
            username: access.username,
            password: access.password,
            status: "pendente" as const,
          };
        });

      if (generated.length === 0) {
        setError("Nenhum nome completo válido foi encontrado no arquivo.");
        return;
      }

      setStudents(generated);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível ler o arquivo."
      );
    }
  }

  async function handleImportStudents() {
    try {
      setError("");
      setSuccessMessage("");

      if (!courseId) {
        setError("Selecione um curso.");
        return;
      }

      if (!classId) {
        setError("Selecione uma turma.");
        return;
      }

      if (students.length === 0) {
        setError("Carregue uma lista antes de importar.");
        return;
      }

      setIsImporting(true);

      const updatedStudents: ImportedStudent[] = [];

      for (const student of students) {
        try {
          await createStudent({
            fullName: student.fullName,
            username: student.username,
            password: student.password,
            courseId,
            classId,
          });

          updatedStudents.push({
            ...student,
            status: "importado",
            message: "Importado",
          });
        } catch (err) {
          updatedStudents.push({
            ...student,
            status: "erro",
            message:
              err instanceof Error ? err.message : "Erro ao importar aluno.",
          });
        }
      }

      setStudents(updatedStudents);
      setSuccessMessage("Importação finalizada. Confira os status da lista.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <aside className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
          Importação
        </p>

        <h2 className="mt-3 text-3xl font-black leading-tight text-[#08213f]">
          Importe alunos em lote.
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Envie CSV ou Excel com os nomes completos na primeira coluna. O sistema gera usuário e senha automaticamente.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Curso
            </label>
            <select
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Turma
            </label>
            <select
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Arquivo CSV ou Excel
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) {
                  handleFileUpload(file);
                }
              }}
              className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-5 text-sm font-bold text-slate-600 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[#08213f] file:px-4 file:py-2 file:text-sm file:font-black file:text-white hover:bg-white"
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              {successMessage}
            </div>
          )}

          <button
            type="button"
            onClick={handleImportStudents}
            disabled={isImporting || students.length === 0}
            className="w-full rounded-full bg-[#08213f] px-7 py-4 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isImporting ? "Importando..." : "Importar alunos"}
          </button>
        </div>

        <div className="mt-6 rounded-[1.5rem] bg-amber-50 p-5">
          <p className="text-sm font-black text-amber-900">
            Modelo da planilha
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            Primeira coluna: Nome Completo. Exemplo: João da Silva Santos.
          </p>
        </div>
      </aside>

      <main className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-100 pb-5">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">
            Prévia
          </p>
          <h2 className="mt-2 text-3xl font-black text-[#08213f]">
            Alunos encontrados
          </h2>
        </div>

        {students.length === 0 ? (
          <div className="mt-8 grid place-items-center rounded-[1.5rem] bg-[#f4f8fc] p-10 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-sm">
              📥
            </div>

            <h3 className="mt-5 text-2xl font-black text-[#08213f]">
              Nenhum arquivo carregado.
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
              Carregue uma planilha para visualizar os acessos gerados.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
            <div className="hidden grid-cols-[1.4fr_1fr_1fr_1fr] bg-slate-50 px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-500 md:grid">
              <div>Aluno</div>
              <div>Usuário</div>
              <div>Senha</div>
              <div>Status</div>
            </div>

            <div className="divide-y divide-slate-200">
              {students.map((student, index) => (
                <div
                  key={`${student.username}-${index}`}
                  className="grid gap-3 px-5 py-5 text-sm md:grid-cols-[1.4fr_1fr_1fr_1fr]"
                >
                  <div className="font-black text-[#08213f]">
                    {student.fullName}
                  </div>

                  <div className="font-black text-blue-700">
                    {student.username}
                  </div>

                  <div className="font-black text-slate-700">
                    {student.password}
                  </div>

                  <div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        student.status === "importado"
                          ? "bg-emerald-50 text-emerald-700"
                          : student.status === "erro"
                          ? "bg-red-50 text-red-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {student.status}
                    </span>

                    {student.message && (
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        {student.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </section>
  );
}
