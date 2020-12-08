const express = require("express");
const NotesService = require("./notes-service");
const path = require("path");
const xss = require("xss");

const notesRouter = express.Router();
const jsonParser = express.json();

const serializeNotes = (note) => ({
  id: note.id,
  folderId: note.folderId,
  name: xss(note.name),
  modified: note.modified,
  content: xss(note.content),
});

notesRouter
  .route("/")
  .get((req, res, next) => {
    NotesService.getAllNotes(req.app.get("db"))
      .then((notes) => {
        res.json(notes.map(serializeNotes));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { folderId, name, content } = req.body;
    const newNote = { folderId, name, content };
    for (const [value] of Object.entries(newNote)) {
      if (value == null) {
        return res.status(204).json({
          error: { message: `Missing '${key}' in request body` },
        });
      }
    }

    NotesService.insertNote(req.app.get("db"), newNote)
      .then((note) => {
        console.log(newNote);
        res
          .status(201)
          .location(`/api/notes/${note.id}`)
          .json(serializeNotes(note));
      })
      .catch(next);
  });

notesRouter
  .route("/:note_id")
  .all((req, res, next) => {
    NotesService.getNoteById(req.app.get("db"), req.params.note_id)
      .then((note) => {
        if (!note) {
          return res.status(404).json({
            error: { message: `note doesn't exist.` },
          });
        }
        res.note = note;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(res.note);
  })
  .delete((req, res, next) => {
    NotesService.deleteNote(req.app.get("db"), req.params.note_id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { name, folderId, content } = req.body;
    const noteToUpdate = { name, folderId, content };

    const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length;

    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain a name, folder, and content.`,
        },
      });
    }

    NotesService.updateNote(req.app.get("db"), req.params.note_id, noteToUpdate)
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = notesRouter;
