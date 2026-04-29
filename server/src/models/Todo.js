const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        completed: { type: Boolean, default: false },
    },
    { timestamps: true }
);

todoSchema.set('toJSON', {
    versionKey: false,
    transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
    },
});

module.exports = mongoose.model('Todo', todoSchema);
