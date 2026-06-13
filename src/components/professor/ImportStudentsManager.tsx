"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { generateStudentAccess } from "@/services/auth.service";
import { ClassRow, getClasses } from "@/services/classes.service";
import { CourseRow, getCourses } from "@/services/courses.service";
import { createStudent } from "@/services/students.service";

type ImportRow = {
  name: string;
  username: string;
  password: string;
  status: "pendente" | "importado" | "erro";
  error?: string;
};

function FormLabel({ children }: { children: string }) {
  return <span className="mb-1.5 block text-xs font-bold text-slate-600">{children}</span>;
}

function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "blue" | "green" | "red";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    red: "bg-red-50 text-red-700 ring-red-100",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function ImportStudentsManager() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [courseId, setCourseId] = useState("");
  const [classId, setClassId] = useState("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const importedCount = rows.filter((row) => row.status === "importado").length;
  const errorCount = rows.filter((row) => row.status === "erro").length;
  const pendingCount = rows.filter((row) => row.status === "pendente").length;

  const validRows = useMemo(() => rows.filter((row) => row.name.trim().split(/\s+/).length >= 2), [rows]);

  async function loadData() {
    try {
      setError("");

      const [coursesData, classesData] = await Promise.all([getCourses(), getClasses()]);

      setCourses(coursesData);
      setClasses(classesData);

      if (!courseId && coursesData[0]) setCourseId(coursesData[0].id);
      if (!classId && classesData[0]) setClassId(classesData[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar dados.");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function parseNamesFromSheet(data: unknown[][]): string[] {
    const names: string[] = [];

    for (const row of data) {
      const firstCell = String(row[0] ?? "").trim();

      if (!firstCell) continue;

      const lower = firstCell.toLowerCase();

      if (
        lower.includes("nome completo") ||
        lower === "nome" ||
        lower === "aluno"
      ) {
        continue;
      }

      names.push(firstCell);
    }

    return Array.from(new Set(names));
  }

  async function handleFileChange(file: File | null) {
    try {
      setError("");
      setMessage("");
      setRows([]);

      if (!file) return;

      setFileName(file.name);

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
      const names = parseNamesFromSheet(data);

      if (names.length === 0) {
        setError("Nenhum nome foi encontrado no arquivo.");
        return;
      }

      const parsedRows = names.map((name) => {
        const access = generateStudentAccess(name);

        return {
          name: access.fullName,
          username: access.username,
          password: access.password,
          status: "pendente" as const,
        };
      });

      setRows(parsedRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível ler o arquivo.");
    }
  }

  async function handleImport() {
    try {
      setError("");
      setMessage("");

      if (!courseId || !classId) {
        setError("Selecione curso e turma antes de importar.");
        return;
      }

      if (validRows.length === 0) {
        setError("Não há alunos válidos para importar.");
        return;
      }

      setIsImporting(true);

      const nextRows = [...rows];

      for (let index = 0; index < nextRows.length; index++) {
        const row = nextRows[index];

        if (row.name.trim().split(/\s+/).length < 2) {
          nextRows[index] = {
            ...row,
            status: "erro",
            error: "Nome incompleto.",
          };
          setRows([...nextRows]);
          continue;
        }

        try {
          await createStudent({
            fullName: row.name,
            username: row.username,
            password: row.password,
            courseId,
            classId,
            simulationAccessMode: "livre",
            freeAllowedDifficulties: ["facil", "medio", "dificil"],
            trailMinScoreToAdvance: 70,
            pedagogicalNotes: "",
          });

          nextRows[index] = { ...row, status: "importado" };
        } catch (err) {
          nextRows[index] = {
            ...row,
            status: "erro",
            error: err instanceof Error ? err.message : "Erro ao importar.",
          };
        }

        setRows([...nextRows]);
      }

      setMessage("Processo de importação finalizado.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 md:px-6">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">Importação</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">Importar alunos por planilha</h2>
        </div>

        <div className="p-5 md:p-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px_260px]">
            <label className="block">
              <FormLabel>Arquivo Excel ou CSV</FormLabel>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
                className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#08213f] file:px-4 file:py-2 file:text-sm file:font-black file:text-white hover:file:bg-blue-800"
              />
            </label>

            <label className="block">
              <FormLabel>Curso</FormLabel>
              <select
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
                className="app-input"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <FormLabel>Turma</FormLabel>
              <select
                value={classId}
                onChange={(event) => setClassId(event.target.value)}
                className="app-input"
              >
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>{classItem.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-blue-50 px-4 py-3 text-blue-700">
              <p className="text-[11px] font-black uppercase tracking-[0.1em] opacity-80">Arquivo</p>
              <p className="mt-1 truncate text-sm font-black">{fileName || "Nenhum arquivo"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
              <p className="text-[11px] font-black uppercase tracking-[0.1em] opacity-80">Pendentes</p>
              <p className="mt-1 text-2xl font-black">{pendingCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-emerald-50 px-4 py-3 text-emerald-700">
              <p className="text-[11px] font-black uppercase tracking-[0.1em] opacity-80">Importados</p>
              <p className="mt-1 text-2xl font-black">{importedCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-red-50 px-4 py-3 text-red-700">
              <p className="text-[11px] font-black uppercase tracking-[0.1em] opacity-80">Erros</p>
              <p className="mt-1 text-2xl font-black">{errorCount}</p>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>
          )}

          {message && (
            <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{message}</div>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={handleImport}
              disabled={isImporting || rows.length === 0}
              className="inline-flex items-center justify-center rounded-xl bg-[#08213f] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isImporting ? "Importando..." : "Importar alunos"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4 md:px-6">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">Prévia</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-[#08213f]">Alunos encontrados</h2>
        </div>

        <div className="p-5 md:p-6">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <h3 className="text-lg font-black text-[#08213f]">Nenhum arquivo carregado.</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">A primeira coluna deve conter o nome completo dos alunos.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row, index) => (
                <article key={`${row.username}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_180px_140px] lg:items-center">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-black text-[#08213f]">{row.name}</h3>
                      {row.error && <p className="mt-1 text-xs font-bold text-red-700">{row.error}</p>}
                    </div>

                    <div className="rounded-2xl bg-blue-50 px-4 py-3">
                      <p className="text-[11px] font-black uppercase text-blue-700">Usuário</p>
                      <p className="mt-1 truncate text-sm font-black text-[#08213f]">{row.username}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-black uppercase text-slate-400">Senha</p>
                      <p className="mt-1 truncate text-sm font-black text-[#08213f]">{row.password}</p>
                    </div>

                    <Badge
                      tone={
                        row.status === "importado"
                          ? "green"
                          : row.status === "erro"
                            ? "red"
                            : "slate"
                      }
                    >
                      {row.status}
                    </Badge>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

