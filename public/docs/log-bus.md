```typescript
export function MyComponent() {
  const { logs, logger } = useLogs();

  const handleAction = () => {
    logger.info("Người dùng vừa click vào nút hành động");
    
    try {
      // ... thực hiện logic
    } catch (e) {
      logger.error("Có lỗi xảy ra trong quá trình xử lý");
    }
  };

  return (
    <div>
      <button onClick={handleAction}>Thực hiện</button>
      {/* Hiển thị log */}
      <pre>{JSON.stringify(logs, null, 2)}</pre>
    </div>
  );
}
```