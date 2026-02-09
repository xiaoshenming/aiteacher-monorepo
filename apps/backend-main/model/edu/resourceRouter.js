const express = require("express")
const path = require("path")
const db = require('../../config/db');
const authorize = require("../auth/authUtils");

// 创建路由
const Router = express.Router()

/*
 * 接口1.1：分页获取试卷列表
 * 请求方式：GET
 * 请求路径：/paper/testpaper
 * 请求参数：
 *   page: 页码
 *   pageSize: 每页数量
 *   grade: 年级（可选）
 *   subject: 科目（可选）
 *   province: 省份 （可选）
 *   city: 城市 （可选）
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
Router.get("/paper/testpaper", authorize(["2", "3", "4"]), async (req, res) => {
    // 获取请求参数
    const { page, pageSize, grade, subject, province, city } = req.query;
    
    // 判断必须参数是否为空
    if (!page || !pageSize) {
        return res.status(400).json({ code: 400, message: '页码和每页数量不能为空', data: null });
    }

    // 计算偏移量（分页）
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    
    // 动态 SQL 语句((暂时取消)降序查询，保证最新上传的试卷在前面)
    let sql = `SELECT * FROM testpaper WHERE 1=1`;
    let params = [];

    if (grade) {
        sql += ` AND grade = ?`;
        params.push(grade);
    }
    if (subject) {
        sql += ` AND subject = ?`;
        params.push(subject);
    }
    if (province) {
        sql += ` AND province = ?`;
        params.push(province);
    }
    if (city) {
        sql += ` AND city = ?`;
        params.push(city);
    }

    // sql += ` ORDER BY create_time DESC`;

    // 执行 SQL 查询，查询符合条件总记录数
    db.query(sql, params, (err, results) => {
        if (err) {
            return res.status(500).json({ code: 500, message: '数据库查询失败', error: err });
        }
        
        // 记录总数
        let total = results.length;

        // 分页
        sql += ` LIMIT ? OFFSET ?`;
        params.push(parseInt(pageSize), offset);

        // 执行 SQL 查询，分页查询
        db.query(sql, params, (err, results) => {
            if (err) {
                return res.status(500).json({ code: 500, message: '数据库查询失败', error: err });
            }
            
            res.json({ code: 200, message: '查询成功', data: { list: results, total } });
        });
        
    });
});

/*
 * 接口1.2：获取试卷详情
 * 请求方式：GET
 * 请求路径：/paper/testpaper/:id
 * 请求参数：
 *   id: 试卷 ID
 * 返回数据：
 *   {
 *     试卷的详情数据
 *   }
 */
Router.get("/paper/testpaper/:id", authorize(["2", "3", "4"]), async (req, res) => {
    // 获取试卷 ID
    const { id } = req.params;

    // 动态 SQL 语句
    let sql = `SELECT * FROM testpaper WHERE id = ?`;
    const params = [id];

    // 执行 SQL 查询
    db.query(sql, params, (err, results) => {
        if (err) {
            return res.status(500).json({ code: 500, message: '数据库查询失败', error: err });
        }
        if (results.length === 0) {
            return res.status(404).json({ code: 404, message: '试卷不存在', data: null });
        }
        res.json({ code: 200, message: '查询成功', data: results[0] });
    });
});

/*
 * 接口1.3：下载试卷封面
 * 请求方式：GET
 * 请求路径：/paper/testpaper/download/:id
 * 请求参数：
 *   id: 试卷 ID
 * 返回数据：
 *   试卷的封面图片
 */
Router.get("/paper/testpaper/download/cover/:id", authorize(["2", "3", "4"]), async (req, res) => {
    // 获取试卷 ID
    const { id } = req.params;

    // 动态 SQL 语句
    let sql = `SELECT * FROM testpaper WHERE id = ?`;
    const params = [id];

    // 执行 SQL 查询
    db.query(sql, params, (err, results) => {
        
        if (err) {
            return res.status(500).json({ code: 500, message: '数据库查询失败', error: err });
        }
        if (results.length === 0) {
            return res.status(404).json({ code: 404, message: '试卷不存在', data: null });
        }
        const filePath = path.join(__dirname, `../../../${results[0].cover}`);
        res.download(filePath);
    });
});

/*
 * 接口1.4：下载试卷本体
 * 请求方式：GET
 * 请求路径：/paper/testpaper/download/body/:id
 * 请求参数：
 *   id: 试卷 ID
 * 返回数据：
 *   试卷的 PDF 文件
 */
Router.get("/paper/testpaper/download/body/:id", authorize(["2", "3", "4"]), async (req, res) => {
    // 获取试卷 ID
    const { id } = req.params;

    // 动态 SQL 语句 (查询文件所在地址)
    let sql = `SELECT * FROM testpaper WHERE id = ?`;
    const params = [id];

    // 执行 SQL 查询（查询文件所在地址）
    db.query(sql, params, (err, results) => {
        
        if (err) {
            return res.status(500).json({ code: 500, message: '数据库查询失败', error: err });
        }
        if (results.length === 0) {
            return res.status(404).json({ code: 404, message: '试卷不存在', data: null });
        }

        // 动态 SQL 语句 (为该试卷增加预览量)
        sql = `UPDATE testpaper SET views = views + 1 WHERE id = ?`;
        params[0] = id;

        // 执行 SQL 更新（为该试卷增加预览量）
        db.query(sql, params, (err, results) => {
            if (err) {
                console.log('数据库更新失败:', err);
                return res.status(500).json({ code: 500, message: '数据库更新失败', error: err });
            }
        });

        // 为客户端返回 试卷DOCX/PDF 文件
        const filePath = path.join(__dirname, `../../../${results[0].downloadUrl}`);
        res.download(filePath);
    });
});

/*
 * 接口1.5：获取所有的年级、科目、省级、市级
 * 请求方式：GET
 * 请求路径：/paper/testpaper/options/all
 * 请求参数：无
 * 返回数据：
 *   {
 *     "code": 200,
 *     "data": {
 *       "grades": [],
 *       "subjects": [],
 *       "provinces": [],
 *       "cities": [],
 *     },
 *     "message": "查询成功"
 */
Router.get("/paper/testpaper/options/all", authorize(["2", "3", "4"]), async (req, res) => {
    // 动态 SQL 语句
    let sql = `SELECT grade, subject, province, city FROM testpaper`;

    // 执行 SQL 查询
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ code: 500, message: '数据库查询失败', error: err });
        }
        const grades = Array.from(new Set(results.map(item => item.grade)));
        const subjects = Array.from(new Set(results.map(item => item.subject)));
        const provinces = Array.from(new Set(results.map(item => item.province)));
        const cities = Array.from(new Set(results.map(item => item.city)));
        res.json({ code: 200, message: '查询成功', data: { grades, subjects, provinces, cities } });
    });
});

/*
 * 接口1.6：搜索试卷接口
 * 请求方式：GET
 * 请求路径：/paper/search/testpaper
 * 请求参数：
 *   keyword: 关键字
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
Router.get("/paper/search/testpaper", authorize(["2", "3", "4"]), async (req, res) => {
    // 获取请求参数
    let { keyword, page, pageSize } = req.query;

    // 判断必须参数是否为空
    if (!keyword || !page || !pageSize) {
        return res.status(400).json({ code: 400, message: '关键字、页码和每页数量不能为空', data: null });
    }

    // 计算偏移量（分页）
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    // 动态 SQL 语句
    let sql = `SELECT * FROM testpaper WHERE title LIKE ? OR grade LIKE ? OR subject LIKE ? OR province LIKE ? OR city LIKE ?`;
    const params = [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, parseInt(pageSize), offset];

    // 执行 SQL 查询，查询符合条件总记录数
    db.query(sql, params, (err, results) => {
        if (err) {
            return res.status(500).json({ code: 500, message: '数据库查询失败', error: err });
        }

        // 记录总数
        let total = results.length;

        // 分页
        sql += ` LIMIT ? OFFSET ?`;
        params.push(parseInt(pageSize), offset);

        // 执行 SQL 查询，分页查询
        db.query(sql, params, (err, results) => {
            if (err) {
                return res.status(500).json({ code: 500, message: '数据库查询失败', error: err });
            }

            res.json({ code: 200, message: '查询成功', data: { list: results, total } });
        });
    });
});

/*
 * 接口1.7：获取默认十条试卷(无需鉴权)
 * 请求方式：GET
 * 请求路径：/paper/testpaper/default/list
 * 请求参数：无
 * 返回数据：
 *   {
 *     "code": 200,
 *     "data": {
 *       "list": [],
 *     },
 *     "message": "查询成功"
 *   }
 */
Router.get("/paper/testpaper/default/list", async (req, res) => {
    // 动态 SQL 语句 (按照ID倒叙查询10条)
    let sql = `SELECT * FROM testpaper ORDER BY id DESC LIMIT 10`;

    // 执行 SQL 查询
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ code: 500, message: '数据库查询失败', error: err });
        }
        res.json({ code: 200, message: '查询成功', data: { list: results } });
    });
});

/*
 * 接口2.1：分页获取课本列表
 * 请求方式：GET
 * 请求路径：/paper/textbook
 * 请求参数：
 *   page: 页码
 *   pageSize: 每页数量
 *   subject: 科目（可选）
 *   province: 省份 （可选）
 *   city: 城市 （可选）
 *   district: 区县 （可选）
 *   verison: 版本（可选，如：人教版）
 *   grade: 年级（可选）
 *   semester: 学期（可选）
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
Router.get("/paper/textbook", authorize(["2", "3", "4"]), async (req, res) => {
    // 获取请求参数
    const { page, pageSize, subject, province, city, district, version, grade, semester } = req.query;

    // 判断必须参数是否为空
    if (!page || !pageSize) {
        return res.status(400).json({ code: 400, message: '页码和每页数量不能为空', data: null });
    }

    // 计算偏移量（分页）
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    // 动态 SQL 语句（(暂时取消)降序查询，保证最新上传的课本在前面）
    let sql = `SELECT * FROM textbook WHERE 1=1`;
    let params = [];

    if (subject) {
        sql += ` AND subject = ?`;
        params.push(subject);
    }
    if (province) {
        sql += ` AND province = ?`;
        params.push(province);
    }
    if (city) {
        sql += ` AND city = ?`;
        params.push(city);
    }
    if (district) {
        sql += ` AND district = ?`;
        params.push(district);
    }
    if (version) {
        sql += ` AND version = ?`;
        params.push(version);
    }
    if (grade) {
        sql += ` AND grade = ?`;
        params.push(grade);
    }
    if (semester) {
        sql += ` AND semester = ?`;
        params.push(semester);
    }

    // sql += ` ORDER BY id DESC`;

    // 执行 SQL 查询，查询符合条件总记录数
    db.query(sql, params, (err, results) => {
        if (err) {
            return res.status(500).json({ code: 500, message: '数据库查询失败', error: err });
        }

        // 记录总数
        let total = results.length;

        // 分页
        sql += ` LIMIT ? OFFSET ?`;
        params.push(parseInt(pageSize), offset);

        // 执行 SQL 查询，分页查询
        db.query(sql, params, (err, results) => {
            if (err) {
                return res.status(500).json({ code: 500, message: '数据库查询失败', error: err });
            }

            res.json({ code: 200, message: '查询成功', data: { list: results, total } });
        });
    });
});

/*
 * 接口2.2：获取课本详情
 * 请求方式：GET
 * 请求路径：/paper/textbook/:id
 * 请求参数：
 *   id: 课本 ID
 * 返回数据：
 *   {
 *     课本的详情数据
 *   }
 */
Router.get("/paper/textbook/:id", authorize(["2", "3", "4"]), async (req, res) => {
    // 获取课本 ID
    const { id } = req.params;

    // 动态 SQL 语句
    let sql = `SELECT * FROM textbook WHERE id = ?`;
    const params = [id];

    // 执行 SQL 查询
    db.query(sql, params, (err, results) => {
        if (err) {
            return res.status(500).json({ code: 500, message: '数据库查询失败', error: err });
        }
        if (results.length === 0) {
            return res.status(404).json({ code: 404, message: '课本不存在', data: null });
        }
        res.json({ code: 200, message: '查询成功', data: results[0] });
    });
});

/*
 * 接口2.3：下载课本封面
 * 请求方式：GET
 * 请求路径：/paper/testpaper/download/cover/:id
 * 请求参数：
 *   id: 课本 ID
 * 返回数据：
 *   课本的封面图
 */
Router.get("/paper/textbook/download/cover/:id", authorize(["2", "3", "4"]), async (req, res) => {
    // 获取课本 ID
    const { id } = req.params;

    // 动态 SQL 语句
    let sql = `SELECT * FROM textbook WHERE id = ?`;
    const params = [id];

    // 执行 SQL 查询
    db.query(sql, params, (err, results) => {
        
        if (err) {
            return res.status(500).json({ code: 500, message: '数据库查询失败', error: err });
        }
        if (results.length === 0) {
            return res.status(404).json({ code: 404, message: '课本不存在', data: null });
        }
        const filePath = path.join(__dirname, `../../../${results[0].cover}`);
        res.download(filePath);
    });
});

/*
 * 接口2.4：下载课本 PDF
 * 请求方式：GET
 * 请求路径：/paper/textbook/download/body/:id
 * 请求参数：
 *   id: 课本 ID
 * 返回数据：
 *   课本的 PDF 文件
 */
Router.get("/paper/textbook/download/body/:id", authorize(["2", "3", "4"]), async (req, res) => {
    // 获取课本 ID
    const { id } = req.params;

    // 动态 SQL 语句(查询文件所在地址)
    let sql = `SELECT * FROM textbook WHERE id = ?`;
    const params = [id];

    // 执行 SQL 查询(查询文件所在地址)
    db.query(sql, params, (err, results) => {
        
        if (err) {
            return res.status(500).json({ code: 500, message: '数据库查询失败', error: err });
        }
        if (results.length === 0) {
            return res.status(404).json({ code: 404, message: '课本不存在', data: null });
        }

        // 动态 SQL 语句(为该课本增加预览量)
        sql = `UPDATE textbook SET views = views + 1 WHERE id = ?`;
        params[0] = id;

        // 执行 SQL 更新(为该课本增加预览量)
        db.query(sql, params, (err, results) => {
            if (err) {
                console.log('数据库更新失败:', err);
            }
        });

        // 为客户端返回 课本PDF 文件
        const filePath = path.join(__dirname, `../../../${results[0].downloadUrl}`);
        res.download(filePath);
    });
});

/*
 * 接口2.5：获取所有的科目、省级、市级、区县、版本、年级、学期
 * 请求方式：GET
 * 请求路径：/paper/textbook/options/all
 * 请求参数：无
 * 返回数据：
 *   {
 *     "code": 200,
 *     "data": {
 *       "subjects": [],
 *       "provinces": [],
 *       "cities": [],
 *       "districts": [],
 *       "versions": [],
 *       "grades": [],
 *       "semesters": [],
 *     },
 *     "message": "查询成功"
 */
Router.get("/paper/textbook/options/all", authorize(["2", "3", "4"]), async (req, res) => {
    // 动态 SQL 语句
    let sql = `SELECT subject, province, city, district, version, grade, semester FROM textbook`;

    // 执行 SQL 查询
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ code: 500, message: '数据库查询失败', error: err });
        }
        const subjects = Array.from(new Set(results.map(item => item.subject)));
        const provinces = Array.from(new Set(results.map(item => item.province)));
        const cities = Array.from(new Set(results.map(item => item.city)));
        const districts = Array.from(new Set(results.map(item => item.district)));
        const versions = Array.from(new Set(results.map(item => item.version)));
        const grades = Array.from(new Set(results.map(item => item.grade)));
        const semesters = Array.from(new Set(results.map(item => item.semester)));
        res.json({ code: 200, message: '查询成功', data: { subjects, provinces, cities, districts, versions, grades, semesters } });
    });
});

/*
 * 接口2.6：搜索课本接口
 * 请求方式：GET
 * 请求路径：/paper/search/textbook
 * 请求参数：
 *   keyword: 关键字
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
Router.get("/paper/search/textbook", authorize(["2", "3", "4"]), async (req, res) => {
    // 获取请求参数
    const { keyword, page, pageSize } = req.query;

    // 判断必须参数是否为空
    if (!keyword || !page || !pageSize) {
        return res.status(400).json({ code: 400, message: '关键字、页码和每页数量不能为空', data: null });
    }

    // 计算偏移量（分页）
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    // 动态 SQL 语句
    let sql = `SELECT * FROM textbook WHERE title LIKE ? OR subject LIKE ? OR province LIKE ? OR city LIKE ? OR district LIKE ? OR version LIKE ? OR grade LIKE ? OR semester LIKE ?`;
    const params = [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, parseInt(pageSize), offset];

    // 执行 SQL 查询，查询符合条件总记录数
    db.query(sql, params, (err, results) => {
        if (err) {
            return res.status(500).json({ code: 500, message: '数据库查询失败', error: err });
        }

        // 记录总数
        let total = results.length;

        // 分页
        sql += ` LIMIT ? OFFSET ?`;
        params.push(parseInt(pageSize), offset);

        // 执行 SQL 查询，分页查询
        db.query(sql, params, (err, results) => {
            if (err) {
                return res.status(500).json({ code: 500, message: '数据库查询失败', error: err });
            }

            res.json({ code: 200, message: '查询成功', data: { list: results, total } });
        });
    });
});

/*
 * 接口2.7：获取默认十条课本(无需鉴权)
 * 请求方式：GET
 * 请求路径：/paper/textbook/default/list
 * 请求参数：无
 * 返回数据：
 *   {
 *     "code": 200,
 *     "data": {
 *       "list": [],
 *     },
 *     "message": "查询成功"
 *   }
 */
Router.get("/paper/textbook/default/list", async (req, res) => {
    // 动态 SQL 语句 (按照ID倒叙查询10条)
    let sql = `SELECT * FROM textbook ORDER BY id DESC LIMIT 10`;

    // 执行 SQL 查询
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ code: 500, message: '数据库查询失败', error: err });
        }
        res.json({ code: 200, message: '查询成功', data: { list: results } });
    });
});

// 暴露路由
module.exports = Router