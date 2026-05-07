const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: 200 },
        description: { type: String, trim: true, maxlength: 500 },
        completed: { type: Boolean, default: false },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium',
        },
        dueDate: { type: Date },
        tags: {
            type: [String],
            validate: {
                validator: (v) => Array.isArray(v) && v.length <= 5,
                message: 'Tags can have at most 5 entries',
            },
        },
        position: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Index for filtering and sorting
todoSchema.index({ completed: 1, position: 1, createdAt: 1 });
todoSchema.index({ priority: 1 });

todoSchema.set('toJSON', {
    versionKey: false,
    transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
    },
});

module.exports = mongoose.model('Todo', todoSchema);
