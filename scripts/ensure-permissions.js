const fs = require('fs');
const path = require('path');

// 确保关键目录的权限正确
const ensurePermissions = () => {
  const dirs = ['uploads', 'logs'];
  
  dirs.forEach(dir => {
    const dirPath = path.resolve(dir);
    
    try {
      // 检查目录是否存在
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true, mode: 0o755 });
        console.log(`✓ 创建目录: ${dir}`);
      }
      
      // 设置权限
      fs.chmodSync(dirPath, 0o755);
      
      // 验证权限
      const stats = fs.statSync(dirPath);
      const mode = (stats.mode & parseInt('777', 8)).toString(8);
      console.log(`✓ 目录 ${dir} 权限: ${mode}`);
      
      // 测试写入权限
      const testFile = path.join(dirPath, '.permission-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log(`✓ 目录 ${dir} 写入权限正常`);
      
    } catch (error) {
      console.error(`✗ 处理目录 ${dir} 时出错:`, error.message);
      process.exit(1);
    }
  });
  
  console.log('✓ 所有目录权限检查完成');
};

if (require.main === module) {
  ensurePermissions();
}

module.exports = ensurePermissions;