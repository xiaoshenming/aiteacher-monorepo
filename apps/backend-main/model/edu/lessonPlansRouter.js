const express = require("express")
const path = require("path")
const db = require('../../config/db');
const authorize = require("../auth/authUtils");

// 创建路由
const Router = express.Router()

/*
 * 接口1.1：分页查询教案列表(状态非3(历史教案))
 * 请求方式：GET
 * 请求路径：/list/notHistory
 * 请求参数：
 *   page: 页码
 *   pageSize: 每页数量
 * 返回数据：
 *   {
 *     "code": 200,
 *     "data": {
 *       "list": [],
 *       "total": 记录总数
 *     },
 *     "message": "查询成功"
 *   }
 */
Router.get("/list/notHistory", authorize(["2", "3", "4"]), async (req, res) => {
    // 1. 获取请求参数
    const { page, pageSize } = req.query;
    
    // 2. 判断必须参数是否为空
    if (!page || !pageSize) {
        return res.status(400).json({ code: 400, message: '页码和每页数量不能为空', data: null });
    }

    // 3. 从解密后的 token 中拿到 loginverification.id
    const loginverificationId = req.user.id;
    
    // 4. 计算偏移量
    const offset = (page - 1) * pageSize;

    // 5. 查询教案列表(状态非3(历史教案))
    const sql1 = `SELECT id, name, content, status, created_at, updated_at FROM lessonplans WHERE status != 3 AND lvid = ? ORDER BY id DESC LIMIT ?,?`;
    const params = [loginverificationId, parseInt(offset), parseInt(pageSize)];
    db.query(sql1, params, (err, results) => {
        if (err) {
            return res.status(500).json({ code: 500, message: '数据库查询失败', error: err });
        }
        const list = results.map(item => {
            return {
                id: item.id,
                name: item.name,
                content: item.content,
                status: item.status,
                created_at: item.created_at,
                updated_at: item.updated_at
            }
        });

        // 6. 查询总数
        const sql2 = `SELECT COUNT(*) as total FROM lessonplans WHERE status != 3 AND lvid = ?`;
        const params2 = [loginverificationId];
        db.query(sql2, params2, (err, results) => {
            if (err) {
                return res.status(500).json({ code: 500, message: '数据库查询失败', error: err });
            }
            const total = results[0].total;

            // 7. 返回数据
            res.json({ code: 200, message: '查询成功', data: { list, total } });
        });
    });
});

/* 
 * 接口1.2：分页查询历史教案列表
 * 请求方式：GET
 * 请求路径：/list/history
 * 请求参数：
 *   page: 页码
 *   pageSize: 每页数量
 * 返回数据：
 *   {
 *     "code": 200,
 *     "data": {
 *       "list": [],
 *       "total": 记录总数
 *     },
 *     "message": "查询成功"
 *   }
 */
Router.get("/list/history", authorize(["2", "3", "4"]), async (req, res) => {
    // 1. 获取请求参数
    const { page, pageSize } = req.query;
    
    // 2. 判断必须参数是否为空
    if (!page || !pageSize) {
        return res.status(400).json({ code: 400, message: '页码和每页数量不能为空', data: null });
    }

    // 3. 从解密后的 token 中拿到 loginverification.id
    const loginverificationId = req.user.id;
    
    // 4. 计算偏移量
    const offset = (page - 1) * pageSize;

    // 5. 查询历史教案列表
    const sql1 = `SELECT id, name, content, status, created_at, updated_at FROM lessonplans WHERE status = 3 AND lvid = ? ORDER BY id DESC LIMIT ?,?`;
    const params = [loginverificationId, parseInt(offset), parseInt(pageSize)];
    db.query(sql1, params, (err, results) => {
        if (err) {
            return res.status(500).json({ code: 500, message: '数据库查询失败', error: err });
        }
        const list = results.map(item => {
            return {
                id: item.id,
                name: item.name,
                content: item.content,
                status: item.status,
                created_at: item.created_at,
                updated_at: item.updated_at
            }
        });

        // 6. 查询总数
        const sql2 = `SELECT COUNT(*) as total FROM lessonplans WHERE status = 3 AND lvid = ?`;
        const params2 = [loginverificationId];
        db.query(sql2, params2, (err, results) => {
            if (err) {
                return res.status(500).json({ code: 500, message: '数据库查询失败', error: err });
            }
            const total = results[0].total;

            // 7. 返回数据
            res.json({ code: 200, message: '查询成功', data: { list, total } });
        });
    });
});

/* 
 * 接口1.3：新增教案
 * 请求方式：POST
 * 请求路径：/add
 * 请求参数：
 *   name: 教案名称
 * 返回数据：
 *   {
 *     "code": 200,
 *     "data": null,
 *     "message": "新增教案成功"
 *   }
 */
Router.post("/add", authorize(["2", "3", "4"]), async (req, res) => {
    // 1. 获取请求参数
    const { name } = req.body;

    // 2. 判断必须参数是否为空
    if (!name) {
        return res.status(400).json({ code: 400, message: '教案名称不能为空', data: null });
    }

    // 3. 从解密后的 token 中拿到 loginverification.id
    const loginverificationId = req.user.id;

    // 4. 新增教案
    const sql = `INSERT INTO lessonplans (name, lvid, updated_at, created_at) VALUES (?,?,?, ?)`;
    const params = [name, loginverificationId, new Date(), new Date()];
    db.query(sql, params, (err, results) => {
        if (err) {
            return res.status(500).json({ code: 500, message: '新增教案失败', error: err });
        }
        // 5. 返回数据
        res.json({ code: 200, message: '新增教案成功', data: null });
    });
});

/* 
 * 接口1.4：编辑(更新)教案
 * 请求方式：POST
 * 请求路径：/edit
 * 请求参数：
 *   id: 教案ID(必须)
 *   name: 教案名称(可选)
 *   content: 教案内容(可选)
 *   status: 教案状态(可选)
 * 返回数据：
 *   {
 *     "code": 200,
 *     "data": null,
 *     "message": "编辑(更新)教案成功"
 *   }
 */
Router.post("/edit", authorize(["2", "3", "4"]), async (req, res) => {
    // 1. 获取请求参数
    const { id, name, content, status } = req.body;

    // 2. 判断必须参数是否为空
    if (!id) {
        return res.status(400).json({ code: 400, message: '教案ID不能为空', data: null });
    }

    // 3. 校验 `status` 必须是整数（如果传了）
    if (status !== undefined && !Number.isInteger(status)) {
        return res.status(400).json({ code: 400, message: 'status 必须是整数', data: null });
    }

    // 4. 从解密后的 token 中拿到 `loginverification.id`
    const loginverificationId = req.user.id;

    // 5. 动态拼接 SQL 语句
    let sql = `UPDATE lessonplans SET `;
    let params = [];

    if (name) {
        sql += `name = ?, `;
        params.push(name);
    }
    if (content) {
        sql += `content = ?, `;
        params.push(content);
    }
    if (status !== undefined) {  // 只有 status 存在时才加入
        sql += `status = ?, `;
        params.push(status);
    }

    // 6. 确保 `updated_at` 最后更新为当前时间
    sql += `updated_at = NOW() WHERE id = ? AND lvid = ?`;
    params.push(id, loginverificationId);

    // 7. 执行 SQL 语句
    db.query(sql, params, (err, results) => {
        if (err) {
            return res.status(500).json({ code: 500, message: '编辑(更新)教案失败', error: err });
        }
        // 8. 返回数据
        res.json({ code: 200, message: '编辑(更新)教案成功', data: null });
    });
});

/* 
 * 接口1.5：删除教案
 * 请求方式：POST
 * 请求路径：/delete
 * 请求参数：
 *   id: 教案ID(必须)
 * 返回数据：
 *   {
 *     "code": 200,
 *     "data": null,
 *     "message": "删除教案成功"
 *   }
 */
Router.post("/delete", authorize(["2", "3", "4"]), async (req, res) => {
    // 1. 获取请求参数
    const { id } = req.body;

    // 2. 判断必须参数是否为空
    if (!id) {
        return res.status(400).json({ code: 400, message: '教案ID不能为空', data: null });
    }

    // 3. 从解密后的 token 中拿到 loginverification.id
    const loginverificationId = req.user.id;

    // 4. 删除教案
    const sql = `DELETE FROM lessonplans WHERE id = ? AND lvid = ?`;
    const params = [id, loginverificationId];
    db.query(sql, params, (err, results) => {
        if (err) {
            return res.status(500).json({ code: 500, message: '删除教案失败', error: err });
        }
        // 5. 返回数据
        res.json({ code: 200, message: '删除教案成功', data: null });
    });
});

/* 
 * 接口1.6：根据 ID 查询教案详情
 * 请求方式：GET
 * 请求路径：/detail
 * 请求参数：
 *   id: 教案ID(必须)
 * 返回数据：
 *   {
 *     "code": 200,
 *     "data": {
 *       "id": 教案ID,
 *       "name": 教案名称,
 *       "content": 教案内容,
 *       "status": 教案状态,
 *       "created_at": 创建时间,
 *       "updated_at": 更新时间
 *     },
 *     "message": "查询成功"
 *   }
 */
Router.get("/detail", authorize(["2", "3", "4"]), async (req, res) => {
    // 1. 获取请求参数
    const { id } = req.query;

    // 2. 判断必须参数是否为空
    if (!id) {
        return res.status(400).json({ code: 400, message: '教案ID不能为空', data: null });
    }

    // 3. 从解密后的 token 中拿到 loginverification.id
    const loginverificationId = req.user.id;

    // 4. 查询教案详情
    const sql = `SELECT id, name, content, status, created_at, updated_at FROM lessonplans WHERE id = ? AND lvid = ?`;
    const params = [id, loginverificationId];
    db.query(sql, params, (err, results) => {
        if (err) {
            return res.status(500).json({ code: 500, message: '查询失败', error: err });
        }
        if (results.length === 0) {
            return res.status(404).json({ code: 404, message: '教案不存在', data: null });
        }
        const data = {
            id: results[0].id,
            name: results[0].name,
            content: results[0].content,
            status: results[0].status,
            created_at: results[0].created_at,
            updated_at: results[0].updated_at
        };
        // 5. 返回数据
        res.json({ code: 200, message: '查询成功', data });
    });
});

/* 
 * 接口1.7 根据关键词搜索教案
 * 请求方式：GET
 * 请求路径：/search
 * 请求参数：
 *   keyword: 关键词(必须)
 *   page: 页码
 *   pageSize: 每页数量
 * 返回数据：
 *   {
 *     "code": 200,
 *     "data": {
 *       "list": [],
 *       "total": 记录总数
 *     },
 *     "message": "查询成功"
 *   }
 */
Router.get("/search", authorize(["2", "3", "4"]), async (req, res) => {
    // 1. 获取请求参数
    const { keyword, page, pageSize } = req.query;

    // 2. 判断必须参数是否为空
    if (!keyword || !page || !pageSize) {
        return res.status(400).json({ code: 400, message: '关键词、页码和每页数量不能为空', data: null });
    }

    // 3. 从解密后的 token 中拿到 loginverification.id
    const loginverificationId = req.user.id;

    // 4. 计算偏移量
    const offset = (page - 1) * pageSize;

    // 5. 查询教案列表
    const sql1 = `SELECT id, name, content, status, created_at, updated_at FROM lessonplans WHERE name LIKE ? AND lvid = ? ORDER BY id DESC LIMIT ?,?`;
    const params1 = [`%${keyword}%`, loginverificationId, parseInt(offset), parseInt(pageSize)];
    db.query(sql1, params1, (err, results) => {
        if (err) {
            return res.status(500).json({ code: 500, message: '数据库查询失败', error: err });
        }
        const list = results.map(item => {
            return {
                id: item.id,
                name: item.name,
                content: item.content,
                status: item.status,
                created_at: item.created_at,
                updated_at: item.updated_at
            }
        });

        // 6. 查询总数
        const sql2 = `SELECT COUNT(*) as total FROM lessonplans WHERE name LIKE ? AND lvid = ?`;
        const params2 = [`%${keyword}%`, loginverificationId];
        db.query(sql2, params2, (err, results) => {
            if (err) {
                return res.status(500).json({ code: 500, message: '数据库查询失败', error: err });
            }
            const total = results[0].total;

            // 7. 返回数据
            res.json({ code: 200, message: '查询成功', data: { list, total } });
        });
    });
});

// 暴露路由
module.exports = Router